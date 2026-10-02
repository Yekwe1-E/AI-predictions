"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, LogOut, User as UserIcon, Menu, X, Clock, Activity, ShieldCheck, History } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import ActivityModal from './ActivityModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ActivityModal isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} />
      
      <nav className="w-full flex justify-between items-center px-6 md:px-8 py-4 max-w-7xl mx-auto relative z-[60] glass-card mt-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Cpu className="text-primary animate-pulse" size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-white flex items-center gap-1">
              Bet<span className="text-primary">Vision</span> <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">PRO</span>
            </h1>
            <span className="text-[10px] text-gray-400 font-medium">Dixon-Coles AI Engine</span>
          </div>
        </Link>

        {/* Live Clock Widget */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
          <Clock size={14} className="text-primary animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-mono font-bold text-white">{currentTime} GMT</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping ml-1" />
          <span className="text-[10px] text-green-400 font-bold uppercase">Auto-Sync</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-gray-300 font-bold">
          <Link href="/predictions" className="hover:text-primary transition-colors flex items-center gap-1.5">
            <Activity size={15} /> Predictions
          </Link>
          
          <button 
            onClick={() => setIsActivityOpen(true)}
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <History size={15} /> Activity Log
          </button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 rounded-full border border-white/10">
                <UserIcon size={14} className="text-primary" />
                <span className="normal-case font-bold text-white">{user.email.split('@')[0]}</span>
              </div>
              <button 
                onClick={logout}
                className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="bg-white text-black px-6 py-2.5 rounded-full font-black hover:bg-gray-200 transition-all shadow-lg"
            >
              Sign In / Register
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full mt-2 glass-card p-6 flex flex-col gap-5 z-[70] md:hidden animate-in fade-in slide-in-from-top-4">
            <Link href="/predictions" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 font-bold">
              <Activity size={18} /> Predictions
            </Link>
            <button onClick={() => { setIsActivityOpen(true); setIsMenuOpen(false); }} className="flex items-center gap-2 font-bold text-left">
              <History size={18} /> System Activity Log
            </button>
            <div className="pt-4 border-t border-white/10">
              {user ? (
                <div className="flex justify-between items-center">
                  <span className="font-bold">{user.email}</span>
                  <button onClick={logout} className="text-red-400 font-bold">Logout</button>
                </div>
              ) : (
                <button 
                  onClick={() => { setIsLoginOpen(true); setIsMenuOpen(false); }}
                  className="w-full bg-white text-black py-3 rounded-xl font-black"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
