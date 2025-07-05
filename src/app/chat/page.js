'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Upload, FileSpreadsheet, Calculator, DollarSign, TrendingUp, Brain, BarChart3, ArrowLeft, Sparkles, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function UltraPremiumChat() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    
    const handleMouseMove = (e) => {
      requestAnimationFrame(() => {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    {
      icon: <FileSpreadsheet className="w-4 h-4" />,
      title: "Process Invoice",
      desc: "Analyze & automate",
      gradient: "from-cyan-400 to-blue-500",
      prompt: "Analyze my supplier invoice identifying normal products, coupons (discounts) and CRV fees (charges). Create Excel formulas to calculate adjusted prices automatically."
    },
    {
      icon: <Calculator className="w-4 h-4" />,
      title: "Excel Formulas",
      desc: "Smart calculations",
      gradient: "from-purple-400 to-pink-500",
      prompt: "Create specialized Excel formulas for B&R Food Services that automatically detect coupons, CRV fees and calculate final adjusted prices."
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      title: "Margin Analysis",
      desc: "Optimize profits",
      gradient: "from-emerald-400 to-teal-500",
      prompt: "Analyze profit margins by product and category. Suggest optimizations to improve profitability considering discounts and additional charges."
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "2026-2028",
      desc: "Event projections",
      gradient: "from-orange-400 to-red-500",
      prompt: "Create demand projections and pricing strategies for FIFA 2026 and Olympics 2028 events in Los Angeles."
    },
    {
      icon: <Brain className="w-4 h-4" />,
      title: "AI Automation",
      desc: "Smart prompts",
      gradient: "from-indigo-400 to-purple-500",
      prompt: "Generate an optimized AI prompt that completely automates B&R Food Services invoice processing."
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: "Dashboard",
      desc: "Executive KPIs",
      gradient: "from-pink-400 to-rose-500",
      prompt: "Design an executive dashboard with key KPIs for B&R Food Services: margins, discounts, volume per client and projections."
    }
  ];

  const sendMessageToAPI = async (message, retry = 0) => {
    try {
      setError(null);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setRetryCount(0);
      return data.response;

    } catch (error) {
      if (retry < 3) {
        setRetryCount(retry + 1);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
        return sendMessageToAPI(message, retry + 1);
      }
      
      setError(error.message);
      return `Connection error. Please try again.`;
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    if (messages.length === 0 && showQuickActions) {
      setShowQuickActions(false);
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    const aiResponse = await sendMessageToAPI(currentMessage);

    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      const fileMessage = {
        id: Date.now(),
        type: 'user',
        content: `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fileMessage]);
      
      if (showQuickActions) {
        setShowQuickActions(false);
      }
      
      setTimeout(() => {
        const analysisPrompt = `Analyze this invoice: ${file.name}. Identify products, coupons, CRV fees and calculate adjusted prices. Generate executive summary with margin impact.`;
        setInputValue(analysisPrompt);
      }, 800);
    }
  };

  const handleQuickAction = (prompt) => {
    setInputValue(prompt);
    setTimeout(() => {
      document.querySelector('input[type="text"]')?.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden relative">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(6, 182, 212, 0.15) 0%, 
              transparent 50%)`,
            transition: 'all 0.3s ease-out'
          }}
        />
        
        {/* Floating Orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ 
               transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
               animationDuration: '8s'
             }} />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ 
               transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`,
               animationDelay: '4s', 
               animationDuration: '10s' 
             }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Minimal Header */}
        <header className="p-6 backdrop-blur-xl bg-white/[0.02]">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-all duration-300">
                <ArrowLeft className="w-5 h-5 text-slate-400 hover:text-white" />
              </Link>
              
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="text-xl font-thin tracking-wider bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  B&R AI
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-slate-400 text-sm">Active</span>
            </div>
          </div>
        </header>

        {/* Main Chat Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            
            {/* Welcome State */}
            {messages.length === 0 && (
              <div className={`text-center mb-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h1 className="text-4xl font-thin mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Welcome to B&R AI
                </h1>
                <p className="text-slate-400 font-light">Financial automation specialist</p>
              </div>
            )}

            {/* Quick Actions Grid */}
            {showQuickActions && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    className={`group relative p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl backdrop-blur-xl 
                      transition-all duration-700 transform hover:scale-105 hover:-translate-y-1
                      ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ 
                      transitionDelay: `${index * 100}ms`,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 bg-gradient-to-r ${action.gradient} rounded-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium text-white">{action.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 text-left">{action.desc}</p>
                    
                    <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`} />
                  </button>
                ))}
              </div>
            )}

            {/* Chat Messages */}
            {!showQuickActions && (
              <div className="relative bg-white/[0.02] backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden mb-4">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl opacity-50 blur"></div>
                <div className="relative bg-slate-900/30 backdrop-blur-2xl rounded-3xl">
                  
                  <div className="h-[400px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        style={{
                          animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white shadow-lg shadow-cyan-500/20'
                              : 'bg-white/[0.05] text-slate-100 backdrop-blur-xl'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className={`text-xs mt-2 ${
                            message.type === 'user' ? 'text-cyan-100/70' : 'text-slate-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between animate-shake">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-300">Connection error. Retrying...</span>
                </div>
                {retryCount > 0 && (
                  <span className="text-xs text-red-400">Attempt {retryCount}/3</span>
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="relative">
              {uploadedFile && (
                <div className="mb-3 p-3 bg-cyan-500/10 rounded-xl flex items-center justify-between animate-slideIn">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300">{uploadedFile.name}</span>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all duration-300"
                  title="Upload file"
                >
                  <Upload className="w-5 h-5" />
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about invoices, margins, projections..."
                  className="flex-1 bg-white/[0.03] backdrop-blur-xl rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300"
                  disabled={isLoading}
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || inputValue.trim() === ''}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Sidebar Quick Actions (when chat is active) */}
            {!showQuickActions && messages.length > 0 && (
              <div className="fixed right-4 top-1/2 transform -translate-y-1/2 space-y-2 z-50">
                {quickActions.slice(0, 4).map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="group p-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg backdrop-blur-xl transition-all duration-300 transform hover:scale-110 hover:translate-x-[-4px]"
                    style={{
                      animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className={`bg-gradient-to-r ${action.gradient} p-2 rounded-lg`}>
                      {action.icon}
                    </div>
                    <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
                      <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg shadow-lg">
                        {action.title}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px) translateY(-50%);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(-50%);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thumb-slate-700::-webkit-scrollbar-thumb {
          background-color: rgb(51 65 85);
          border-radius: 3px;
        }

        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
}