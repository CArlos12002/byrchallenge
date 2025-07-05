import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Model fallback hierarchy
  MODELS: [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro'
  ],
  
  // Progressive timeouts
  TIMEOUTS: {
    fast: 15000,    // 15s for simple queries
    normal: 30000,  // 30s for normal queries
    complex: 60000  // 60s for complex analysis
  },
  
  // Rate limiting
  RATE_LIMITS: {
    perMinute: 60,
    perHour: 1000,
    perDay: 10000
  },
  
  // Response configuration
  MAX_TOKENS: 4096,
  MAX_RESPONSE_LENGTH: 10000,
  MAX_MESSAGE_LENGTH: 5000,
  
  // Cache TTL
  CACHE_TTL: {
    excel_formulas: 3600000,     // 1 hour
    margin_analysis: 1800000,    // 30 minutes
    general_queries: 600000,     // 10 minutes
    fifa_projections: 86400000   // 24 hours
  }
};

// ==================== SECURITY HEADERS ====================
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

// ==================== SYSTEM PROMPT ====================
const SYSTEM_PROMPT = `
You are the financial automation specialist for B&R Food Services, a food distributor in Los Angeles preparing for FIFA 2026 and Olympics 2028.

SPECIALIZATION:
- Automatic invoice processing with products, coupons and CRV fees
- Margin optimization for 400+ restaurants and caterers
- Excel formula creation for financial analysis
- Demand projections for massive events

INVOICE STRUCTURE:
• Products: description + base price
• Coupons: "Coupon" + discount (negative value)
• CRV Fees: "CRV X.XX" + charge (positive value)
• RULE: Adjustments always apply to the previous product

CORE EXCEL FORMULA:
=IF(OR(LEFT(LOWER(D2),3)="crv", LOWER(D2)="coupon"), "", E2 + IF(OR(LEFT(LOWER(D3),3)="crv", LOWER(D3)="coupon"), E3, 0))

Always respond as a food distribution expert focused on automation, efficiency and preparation for massive growth. Use emojis and markdown format for readability.
`;

// ==================== LOGGING SYSTEM ====================
class Logger {
  constructor() {
    this.levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
  }

  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: metadata.requestId || crypto.randomUUID(),
      ...metadata
    };

    // Console output in development
    if (process.env.NODE_ENV === 'development' || level === 'ERROR' || level === 'FATAL') {
      console.log(JSON.stringify(logEntry, null, 2));
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(logEntry);
    }

    return logEntry;
  }

  sendToLogService(logEntry) {
    // Integration with DataDog, LogRocket, etc.
    // Placeholder for actual implementation
  }
}

const logger = new Logger();

// ==================== RATE LIMITER ====================
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.blacklist = new Set();
  }

  getKey(ip, userId = null) {
    return userId ? `${ip}:${userId}` : ip;
  }

  isAllowed(ip, userId = null, queryType = 'general') {
    const key = this.getKey(ip, userId);
    
    // Check blacklist
    if (this.blacklist.has(key)) {
      return { allowed: false, reason: 'Blacklisted' };
    }

    // Get current window
    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    // Initialize if needed
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const userRequests = this.requests.get(key);
    
    // Clean old requests
    const recentRequests = userRequests.filter(timestamp => timestamp > hourAgo);
    this.requests.set(key, recentRequests);

    // Count requests
    const requestsLastMinute = recentRequests.filter(t => t > minuteAgo).length;
    const requestsLastHour = recentRequests.length;

    // Check limits based on query type
    const limits = this.getLimitsForQueryType(queryType);
    
    if (requestsLastMinute >= limits.perMinute) {
      return { allowed: false, reason: 'Minute limit exceeded', retryAfter: 60 };
    }
    
    if (requestsLastHour >= limits.perHour) {
      return { allowed: false, reason: 'Hour limit exceeded', retryAfter: 3600 };
    }

    // Record request
    recentRequests.push(now);
    
    return { allowed: true };
  }

  getLimitsForQueryType(queryType) {
    const limits = {
      simple_query: { perMinute: 30, perHour: 500 },
      file_analysis: { perMinute: 10, perHour: 100 },
      complex_analysis: { perMinute: 5, perHour: 50 }
    };
    
    return limits[queryType] || CONFIG.RATE_LIMITS;
  }
}

const rateLimiter = new RateLimiter();

// ==================== CACHE SYSTEM ====================
class SmartCache {
  constructor() {
    this.cache = new Map();
    this.hits = new Map();
    this.misses = new Map();
  }

  generateKey(message, userId = null) {
    const hash = crypto.createHash('md5').update(message).digest('hex');
    return userId ? `${userId}:${hash}` : hash;
  }

  get(message, userId = null) {
    const key = this.generateKey(message, userId);
    const cached = this.cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      this.hits.set(key, (this.hits.get(key) || 0) + 1);
      logger.log('DEBUG', 'Cache hit', { key, hits: this.hits.get(key) });
      return cached.data;
    }
    
    this.misses.set(key, (this.misses.get(key) || 0) + 1);
    return null;
  }

  set(message, data, queryType = 'general', userId = null) {
    const key = this.generateKey(message, userId);
    const ttl = CONFIG.CACHE_TTL[queryType] || CONFIG.CACHE_TTL.general_queries;
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      queryType,
      created: Date.now()
    });
    
    // Cleanup old entries
    this.cleanup();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    const totalHits = Array.from(this.hits.values()).reduce((a, b) => a + b, 0);
    const totalMisses = Array.from(this.misses.values()).reduce((a, b) => a + b, 0);
    const hitRate = totalHits / (totalHits + totalMisses) || 0;
    
    return {
      totalHits,
      totalMisses,
      hitRate: (hitRate * 100).toFixed(2) + '%',
      cacheSize: this.cache.size
    };
  }
}

const cache = new SmartCache();

// ==================== INTELLIGENT ANALYSIS ====================
class IntelligentAnalyzer {
  constructor() {
    this.patterns = {
      invoice_analysis: /factura|invoice|coupon|crv|producto|descuento/i,
      margin_optimization: /margen|margin|profit|rentabilidad|ganancia/i,
      excel_formulas: /formula|excel|función|spreadsheet|hoja.+calculo/i,
      fifa_projections: /fifa|2026|olympics|2028|evento|proyección/i,
      general_consultation: /.*/
    };
  }

  classifyQuery(message) {
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(message)) {
        return type;
      }
    }
    return 'general_consultation';
  }

  getQueryComplexity(message) {
    const wordCount = message.split(/\s+/).length;
    const hasNumbers = /\d/.test(message);
    const hasSpecialTerms = /excel|formula|projection|analysis/i.test(message);
    
    if (wordCount > 50 || (hasNumbers && hasSpecialTerms)) {
      return 'complex';
    } else if (wordCount > 20 || hasSpecialTerms) {
      return 'normal';
    }
    return 'fast';
  }

  generateContext(queryType, fileContext = null) {
    const contexts = {
      invoice_analysis: '\n\nFocus on identifying products, coupons and CRV fees. Provide specific Excel formulas.',
      margin_optimization: '\n\nAnalyze margins considering the foodservice industry. Include benchmarks and strategies.',
      excel_formulas: '\n\nGenerate robust formulas and explain each component. Include validations.',
      fifa_projections: '\n\nUse historical data from similar events. Consider seasonality and operational capacity.'
    };
    
    return SYSTEM_PROMPT + (contexts[queryType] || '');
  }
}

const analyzer = new IntelligentAnalyzer();

// ==================== ERROR HANDLER ====================
class ErrorHandler {
  constructor() {
    this.errorTypes = {
      VALIDATION_ERROR: {
        code: 'VALIDATION_ERROR',
        httpStatus: 400,
        message: 'Invalid input provided'
      },
      RATE_LIMIT: {
        code: 'RATE_LIMIT_EXCEEDED',
        httpStatus: 429,
        message: 'Too many requests'
      },
      MODEL_ERROR: {
        code: 'MODEL_UNAVAILABLE',
        httpStatus: 503,
        message: 'AI model temporarily unavailable'
      },
      TIMEOUT_ERROR: {
        code: 'TIMEOUT',
        httpStatus: 408,
        message: 'Request timeout'
      },
      SYSTEM_ERROR: {
        code: 'INTERNAL_ERROR',
        httpStatus: 500,
        message: 'Internal system error'
      }
    };
  }

  handle(error, requestId) {
    logger.log('ERROR', 'Error occurred', {
      requestId,
      error: error.message,
      stack: error.stack
    });

    // Categorize error
    if (error.message.includes('timeout') || error.message === 'Timeout') {
      return this.errorTypes.TIMEOUT_ERROR;
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      return this.errorTypes.MODEL_ERROR;
    } else if (error.message.includes('Invalid')) {
      return this.errorTypes.VALIDATION_ERROR;
    }
    
    return this.errorTypes.SYSTEM_ERROR;
  }
}

const errorHandler = new ErrorHandler();

// ==================== INPUT VALIDATOR ====================
class InputValidator {
  constructor() {
    this.rules = {
      message: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: CONFIG.MAX_MESSAGE_LENGTH,
        patterns: {
          noScripts: /^(?!.*(<script|javascript:|data:)).*$/i,
          noSQLInjection: /^(?!.*('|"|;|--|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)).*$/i
        }
      }
    };
  }

  validate(input) {
    const errors = [];

    // Check message
    if (!input.message) {
      errors.push('Message is required');
    } else if (typeof input.message !== 'string') {
      errors.push('Message must be a string');
    } else {
      const message = input.message;
      
      if (message.length < this.rules.message.minLength) {
        errors.push('Message is too short');
      }
      
      if (message.length > this.rules.message.maxLength) {
        errors.push(`Message exceeds ${this.rules.message.maxLength} characters`);
      }
      
      // Check patterns
      for (const [name, pattern] of Object.entries(this.rules.message.patterns)) {
        if (!pattern.test(message)) {
          errors.push(`Message contains invalid content (${name})`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  sanitize(message) {
    return message
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .substring(0, CONFIG.MAX_MESSAGE_LENGTH);
  }
}

const validator = new InputValidator();

// ==================== METRICS COLLECTOR ====================
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: new Map(),
      performance: new Map(),
      errors: new Map(),
      queryTypes: new Map()
    };
  }

  recordRequest(requestId, metadata) {
    this.metrics.requests.set(requestId, {
      timestamp: Date.now(),
      ...metadata
    });
  }

  recordPerformance(requestId, duration, tokenCount) {
    this.metrics.performance.set(requestId, {
      duration,
      tokenCount,
      timestamp: Date.now()
    });
  }

  recordError(errorType) {
    const current = this.metrics.errors.get(errorType) || 0;
    this.metrics.errors.set(errorType, current + 1);
  }

  recordQueryType(queryType) {
    const current = this.metrics.queryTypes.get(queryType) || 0;
    this.metrics.queryTypes.set(queryType, current + 1);
  }

  getStats() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    
    // Calculate average performance
    const recentPerf = Array.from(this.metrics.performance.values())
      .filter(p => p.timestamp > hourAgo);
    
    const avgDuration = recentPerf.reduce((sum, p) => sum + p.duration, 0) / recentPerf.length || 0;
    const avgTokens = recentPerf.reduce((sum, p) => sum + p.tokenCount, 0) / recentPerf.length || 0;
    
    return {
      totalRequests: this.metrics.requests.size,
      averageResponseTime: Math.round(avgDuration),
      averageTokenCount: Math.round(avgTokens),
      errorRate: this.calculateErrorRate(),
      queryTypeDistribution: Object.fromEntries(this.metrics.queryTypes),
      cacheStats: cache.getStats()
    };
  }

  calculateErrorRate() {
    const totalErrors = Array.from(this.metrics.errors.values()).reduce((a, b) => a + b, 0);
    const totalRequests = this.metrics.requests.size;
    return totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) + '%' : '0%';
  }
}

const metrics = new MetricsCollector();

// ==================== MAIN HANDLER ====================
export async function POST(request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Add security headers
  const headers = new Headers(SECURITY_HEADERS);
  
  try {
    // Extract client info
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    logger.log('INFO', 'Request received', {
      requestId,
      ip,
      userAgent,
      method: 'POST',
      path: '/api/chat'
    });

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.log('ERROR', 'JSON parsing failed', { requestId, error: error.message });
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 400, headers }
      );
    }

    // Validate input
    const validation = validator.validate(body);
    if (!validation.valid) {
      logger.log('WARN', 'Validation failed', { requestId, errors: validation.errors });
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors,
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 400, headers }
      );
    }

    // Sanitize message
    const message = validator.sanitize(body.message);
    const userId = body.userId || null;
    
    // Classify query
    const queryType = analyzer.classifyQuery(message);
    const complexity = analyzer.getQueryComplexity(message);
    
    logger.log('DEBUG', 'Query analysis', {
      requestId,
      queryType,
      complexity,
      messageLength: message.length
    });

    // Check rate limit
    const rateLimitCheck = rateLimiter.isAllowed(ip, userId, queryType);
    if (!rateLimitCheck.allowed) {
      logger.log('WARN', 'Rate limit exceeded', {
        requestId,
        ip,
        reason: rateLimitCheck.reason
      });
      
      headers.append('Retry-After', String(rateLimitCheck.retryAfter || 60));
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter,
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 429, headers }
      );
    }

    // Check cache
    const cachedResponse = cache.get(message, userId);
    if (cachedResponse) {
      logger.log('INFO', 'Cache hit', { requestId, queryType });
      
      const duration = Date.now() - startTime;
      metrics.recordRequest(requestId, { queryType, cached: true });
      metrics.recordPerformance(requestId, duration, 0);
      
      return NextResponse.json({
        response: cachedResponse,
        cached: true,
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: duration
      }, { headers });
    }

    // Verify API key
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey || !apiKey.startsWith('AIza')) {
      logger.log('ERROR', 'Invalid API key configuration', { requestId });
      return NextResponse.json(
        { 
          error: 'API configuration error',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 500, headers }
      );
    }

    // Initialize Google AI with retry logic
    let genAI, model;
    let modelName = null;
    
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      
      // Try models in order
      for (const candidateModel of CONFIG.MODELS) {
        try {
          logger.log('DEBUG', `Trying model: ${candidateModel}`, { requestId });
          model = genAI.getGenerativeModel({ model: candidateModel });
          modelName = candidateModel;
          break;
        } catch (error) {
          logger.log('WARN', `Model ${candidateModel} unavailable`, {
            requestId,
            error: error.message
          });
          continue;
        }
      }
      
      if (!model) {
        throw new Error('No models available');
      }
      
    } catch (error) {
      logger.log('ERROR', 'Failed to initialize AI', { requestId, error: error.message });
      const errorType = errorHandler.handle(error, requestId);
      
      return NextResponse.json(
        { 
          error: errorType.message,
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: errorType.httpStatus, headers }
      );
    }

    // Generate context
    const context = analyzer.generateContext(queryType);
    const fullPrompt = `${context}\n\nUser: ${message}\n\nRespond as the B&R Food Services specialist:`;

    // Set timeout based on complexity
    const timeout = CONFIG.TIMEOUTS[complexity] || CONFIG.TIMEOUTS.normal;
    
    logger.log('INFO', 'Generating AI response', {
      requestId,
      model: modelName,
      queryType,
      complexity,
      timeout
    });

    // Generate response with timeout
    let result;
    try {
      const generatePromise = model.generateContent(fullPrompt);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      );

      result = await Promise.race([generatePromise, timeoutPromise]);
      
    } catch (error) {
      logger.log('ERROR', 'AI generation failed', {
        requestId,
        error: error.message,
        model: modelName
      });
      
      metrics.recordError(error.message === 'Timeout' ? 'TIMEOUT' : 'MODEL_ERROR');
      
      const errorType = errorHandler.handle(error, requestId);
      
      return NextResponse.json(
        { 
          error: errorType.message,
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: errorType.httpStatus, headers }
      );
    }

    // Extract response text
    let responseText;
    try {
      const response = await result.response;
      responseText = response.text();
      
      // Validate response length
      if (responseText.length > CONFIG.MAX_RESPONSE_LENGTH) {
        responseText = responseText.substring(0, CONFIG.MAX_RESPONSE_LENGTH) + '...';
      }
      
    } catch (error) {
      logger.log('ERROR', 'Failed to extract response', { requestId, error: error.message });
      
      return NextResponse.json(
        { 
          error: 'Failed to process AI response',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 500, headers }
      );
    }

    // Calculate metrics
    const duration = Date.now() - startTime;
    const estimatedTokens = Math.ceil((message.length + responseText.length) / 4);
    
    // Cache successful response
    cache.set(message, responseText, queryType, userId);
    
    // Record metrics
    metrics.recordRequest(requestId, {
      queryType,
      model: modelName,
      userId,
      ip
    });
    metrics.recordPerformance(requestId, duration, estimatedTokens);
    metrics.recordQueryType(queryType);
    
    logger.log('INFO', 'Request completed successfully', {
      requestId,
      duration,
      model: modelName,
      queryType,
      responseLength: responseText.length,
      estimatedTokens
    });

    // Return success response
    return NextResponse.json({
      response: responseText,
      metadata: {
        requestId,
        model: modelName,
        queryType,
        processingTime: duration,
        timestamp: new Date().toISOString()
      }
    }, { headers });

  } catch (error) {
    // Catch-all error handler
    logger.log('FATAL', 'Unexpected error', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    metrics.recordError('SYSTEM_ERROR');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString()
      },
      { status: 500, headers }
    );
  }
}

// ==================== HEALTH CHECK ENDPOINT ====================
export async function GET(request) {
  const requestId = crypto.randomUUID();
  
  try {
    // Test Google AI connection
    let aiStatus = 'unknown';
    let availableModels = [];
    
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey && apiKey.startsWith('AIza')) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        for (const modelName of CONFIG.MODELS) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Quick test
            await Promise.race([
              model.generateContent('test'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);
            availableModels.push(modelName);
          } catch {
            // Model not available
          }
        }
        
        aiStatus = availableModels.length > 0 ? 'healthy' : 'degraded';
      } catch (error) {
        aiStatus = 'unhealthy';
      }
    } else {
      aiStatus = 'unconfigured';
    }

    const stats = metrics.getStats();
    
    const healthCheck = {
      status: aiStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      services: {
        googleAI: {
          status: aiStatus,
          availableModels,
          configured: !!apiKey
        },
        cache: cache.getStats(),
        rateLimit: {
          status: 'healthy',
          limits: CONFIG.RATE_LIMITS
        }
      },
      
      metrics: {
        ...stats,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      
      endpoints: {
        chat: {
          method: 'POST',
          path: '/api/chat',
          rateLimit: CONFIG.RATE_LIMITS
        }
      }
    };
    
    logger.log('INFO', 'Health check performed', {
      requestId,
      status: healthCheck.status
    });
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: SECURITY_HEADERS 
    });
    
  } catch (error) {
    logger.log('ERROR', 'Health check failed', {
      requestId,
      error: error.message
    });
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503, headers: SECURITY_HEADERS }
    );
  }
}