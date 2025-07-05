'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, Target, ChevronDown, CircuitBoard } from 'lucide-react';

const ROTATING_TEXTS = ['Intelligence', 'Automation', 'Precision', 'Excellence', 'Innovation'];

export default function SpectacularHomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fixed typewriter effect
  useEffect(() => {
    const currentWord = ROTATING_TEXTS[textIndex];
    let charIndex = 0;
    setIsTyping(true);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Typing phase
    intervalRef.current = setInterval(() => {
      if (charIndex <= currentWord.length) {
        setCurrentText(currentWord.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(intervalRef.current);
        setIsTyping(false);
        
        // Wait, then start clearing
        setTimeout(() => {
          setIsTyping(true);
          intervalRef.current = setInterval(() => {
            setCurrentText(currentWord.slice(0, charIndex));
            charIndex--;
            if (charIndex < 0) {
              clearInterval(intervalRef.current);
              setTextIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
            }
          }, 80);
        }, 2500);
      }
    }, 150);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [textIndex]);

  const features = [
    { 
      icon: <Target className="w-7 h-7" />, 
      title: "Specialized AI", 
      desc: "Invoice processing with surgical precision",
      gradient: "from-blue-400 to-cyan-400"
    },
    { 
      icon: <Zap className="w-7 h-7" />, 
      title: "Automation", 
      desc: "82% reduction in processing time",
      gradient: "from-purple-400 to-pink-400"
    },
    { 
      icon: <Sparkles className="w-7 h-7" />, 
      title: "Future Ready", 
      desc: "FIFA 2026 & Olympics 2028 prepared",
      gradient: "from-emerald-400 to-teal-400"
    }
  ];

  const metrics = [
    { number: "100", suffix: "%", label: "Accuracy", color: "text-blue-400" },
    { number: "82", suffix: "%", label: "Time Saved", color: "text-purple-400" },
    { number: "400", suffix: "+", label: "Clients", color: "text-emerald-400" },
    { number: "2026", suffix: "", label: "Ready", color: "text-cyan-400" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden relative">
      
      {/* Ultra Advanced Background */}
      <div className="absolute inset-0">
        {/* Animated Mesh Gradient */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                rgba(59, 130, 246, 0.15) 0%, 
                rgba(147, 51, 234, 0.1) 25%,
                rgba(16, 185, 129, 0.1) 50%,
                transparent 70%)
            `,
            transition: 'all 0.3s ease'
          }}
        />
        
        {/* Dynamic Grid */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px) rotate(${mousePosition.x * 0.02}deg)`,
            transition: 'transform 0.2s ease'
          }}
        />
        
        {/* Floating Orbs with Enhanced Animation */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ 
               transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
               animationDuration: '6s'
             }} />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ 
               transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`,
               animationDelay: '2s', 
               animationDuration: '8s' 
             }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl animate-pulse" 
             style={{ 
               transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
               animationDelay: '4s', 
               animationDuration: '10s' 
             }} />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Ultra Minimal Header */}
        <header className="p-8 backdrop-blur-xl bg-white/[0.02] border-b border-white/5">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="text-3xl font-thin tracking-[0.2em]">
              <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                B&R
              </span>
            </div>
            <div className="flex items-center space-x-8 text-sm text-slate-400">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <span className="font-light tracking-wide">Active</span>
              </div>
              <div className="text-xs text-slate-500 bg-slate-800/30 px-3 py-1 rounded-full border border-slate-700/50">
                AI Challenge
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section - Ultra Centrado */}
        <main className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="max-w-6xl mx-auto text-center">
            
            {/* Spectacular Logo Animation */}
            <div className={`mb-12 transition-all duration-3000 ease-out ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95'}`}>
              <div className="relative inline-block group">
                <div className="w-32 h-32 mx-auto relative">
                  {/* Multiple Rotating Rings */}
                  <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-spin" style={{ animationDuration: '20s' }} />
                  <div className="absolute inset-2 rounded-full border border-purple-500/20 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                  <div className="absolute inset-4 rounded-full border border-emerald-500/20 animate-spin" style={{ animationDuration: '10s' }} />
                  
                  {/* Central Orb */}
                  <div className="absolute inset-6 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-700">
                    <CircuitBoard className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  
                  {/* Pulsing Aura */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-full blur-xl animate-pulse" />
                </div>
              </div>
            </div>

            {/* Spectacular Title */}
            <div className={`mb-8 transition-all duration-3000 ease-out delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-thin mb-8 leading-none tracking-tight">
                <span 
                  className="bg-gradient-to-r from-white via-blue-200 via-purple-200 to-emerald-200 bg-clip-text text-transparent"
                  style={{
                    filter: `hue-rotate(${mousePosition.x}deg)`,
                    transition: 'filter 0.3s ease'
                  }}
                >
                  B&R Food Services
                </span>
              </h1>
              
              {/* Ultra Advanced Rotating Text */}
              <div className="text-3xl md:text-4xl lg:text-5xl text-slate-300 font-extralight flex items-center justify-center">
                <span className="mr-6 text-slate-400">AI</span>
                <div className="relative min-w-[300px] h-16 flex items-center justify-start">
                  <span 
                    className={`absolute left-0 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent transition-all duration-500 ${isTyping ? 'opacity-100' : 'opacity-80'}`}
                    style={{
                      transform: `translateY(${Math.sin(Date.now() * 0.001) * 2}px)`,
                    }}
                  >
                    {currentText}
                  </span>
                  <span className={`absolute animate-pulse text-blue-400 ${isTyping ? 'opacity-100' : 'opacity-0'}`} style={{ left: `${currentText.length * 0.6}em` }}>
                    |
                  </span>
                </div>
              </div>
            </div>

            {/* Elegant Subtitle */}
            <p className={`text-xl md:text-2xl text-slate-400 mb-16 max-w-4xl mx-auto leading-relaxed font-light transition-all duration-3000 ease-out delay-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              Sophisticated financial automation for food service distributors
              <span className="block text-slate-500 mt-4 text-lg tracking-wide">
                FIFA World Cup 2026 · Summer Olympics 2028
              </span>
            </p>

            {/* Ultra Advanced CTA */}
            <div className={`mb-20 transition-all duration-3000 ease-out delay-1500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              <Link href="/chat">
                <button className="group relative px-16 py-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-full text-xl font-light hover:from-slate-700/60 hover:to-slate-600/60 transition-all duration-700 transform hover:scale-105 border border-slate-600/30 hover:border-slate-500/50 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/20">
                  <span className="relative z-10 flex items-center space-x-4">
                    <span className="tracking-wide">Start IA</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform duration-700" />
                  </span>
                  
                  {/* Multiple Hover Effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm" />
                  <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity duration-700" />
                </button>
              </Link>
            </div>

            {/* Spectacular Features */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 transition-all duration-3000 ease-out delay-2000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-10 bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-700 hover:bg-white/[0.05] transform hover:scale-105 hover:-translate-y-2"
                  style={{
                    animationDelay: `${2000 + index * 200}ms`
                  }}
                >
                  <div className={`text-slate-400 mb-8 group-hover:scale-125 transition-all duration-700 flex justify-center`}>
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-700`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-white font-light text-2xl mb-6 group-hover:text-slate-100 transition-colors duration-700 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-base leading-relaxed group-hover:text-slate-400 transition-colors duration-700 font-light text-center">
                    {feature.desc}
                  </p>
                  
                  {/* Advanced Glow Effects */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-700 blur-xl`} />
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              ))}
            </div>

            {/* Spectacular Metrics */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-16 mb-20 transition-all duration-3000 ease-out delay-2500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              {metrics.map((metric, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className={`text-4xl md:text-5xl lg:text-6xl font-thin mb-4 group-hover:scale-110 transition-all duration-700 ${metric.color}`}
                       style={{
                         textShadow: '0 0 20px currentColor',
                         filter: 'drop-shadow(0 0 10px currentColor)'
                       }}>
                    {metric.number}
                    <span className="text-slate-400 text-3xl">{metric.suffix}</span>
                  </div>
                  <div className="text-slate-500 text-sm uppercase tracking-[0.2em] font-light group-hover:text-slate-400 transition-colors duration-700">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Animated Scroll Indicator */}
            <div className="animate-bounce opacity-50 hover:opacity-80 transition-opacity cursor-pointer transform hover:scale-110">
              <ChevronDown className="w-6 h-6 text-slate-400 mx-auto" />
            </div>
          </div>
        </main>

        {/* Ultra Sophisticated Footer */}
        <footer className="p-8 backdrop-blur-xl bg-white/[0.02] border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
              <p className="text-slate-500 text-sm font-light tracking-wide">
                © 2024 B&R Food Services AI Assistant
              </p>
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 text-xs text-slate-600">
                <span className="text-slate-400 font-medium tracking-wide bg-slate-800/30 px-4 py-2 rounded-full border border-slate-700/50">
                  Created by Carlos Anaya Ruiz
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`,
              opacity: Math.random() * 0.3 + 0.1,
              animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px currentColor`
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg); 
            opacity: 0.1;
          }
          25% { 
            transform: translateY(-20px) translateX(10px) rotate(90deg); 
            opacity: 0.3;
          }
          50% { 
            transform: translateY(-10px) translateX(-5px) rotate(180deg); 
            opacity: 0.2;
          }
          75% { 
            transform: translateY(-30px) translateX(-10px) rotate(270deg); 
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}