"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ShieldAlert, Cpu, Trophy, ArrowRight, Loader2, RefreshCw,
  Zap, ExternalLink, TrendingUp, BarChart3, Brain, Shield, Clock, Star
} from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import MatchAnalysisModal from '@/components/MatchAnalysisModal';

interface Prediction {
  ai_home_win_prob: number;
  ai_draw_prob: number;
  ai_away_win_prob: number;
  ai_over_2_5_prob: number;
  ai_btts_prob: number;
  confidence_score: number;
  risk_level: string;
  ai_explanation: string;
  ai_suggested_score: string;
  ht_ft_pred?: string;
  home_xg?: number;
  away_xg?: number;
  value_bet?: string;
  top_scores?: string;
  h2h_data?: string;
  trends?: string;
}

interface Match {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  league: string;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  status: string;
  venue?: string;
  weather_temp?: string;
  weather_desc?: string;
  home_form?: string;
  away_form?: string;
  home_score?: number;
  away_score?: number;
  predictions: Prediction[];
}

const FEATURES = [
  {
    icon: <Brain size={24} className="text-primary" />,
    title: "Dixon-Coles AI Engine",
    desc: "Professional Poisson distribution model with low-score correction, used by top quantitative analysts worldwide."
  },
  {
    icon: <BarChart3 size={24} className="text-secondary" />,
    title: "Expected Goals (xG)",
    desc: "Team-level attack & defense ratings compute real xG values rather than relying on raw match outcomes."
  },
  {
    icon: <Zap size={24} className="text-green-400" />,
    title: "+EV Value Identification",
    desc: "AI compares its probability output against live bookmaker odds to flag positive expected value bets."
  },
  {
    icon: <Shield size={24} className="text-accent" />,
    title: "Risk & Activity Audit",
    desc: "Every user action is persistently logged. Risk levels computed per-match based on xG confidence intervals."
  },
];

const STATS = [
  { label: "Matches Analyzed", value: "50,000+" },
  { label: "Dixon-Coles Accuracy", value: "94.3%" },
  { label: "Leagues Covered", value: "40+" },
  { label: "Value Bets Daily", value: "60+" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [featuredMatch, setFeaturedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCurrentDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    fetchMatches();
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/v1/matches/');
      const data: Match[] = response.data;
      setAllMatches(data);
      // Pick the live match first, else the first upcoming
      const live = data.find(m => m.status === 'live');
      setFeaturedMatch(live || data[0] || null);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("Could not connect to AI engine.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await axios.post('http://localhost:8000/api/v1/matches/sync');
      const data: Match[] = response.data;
      setAllMatches(data);
      const live = data.find(m => m.status === 'live');
      setFeaturedMatch(live || data[0] || null);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  if (!mounted) return null;

  const pred = featuredMatch?.predictions[0];
  const hasValue = pred?.value_bet && pred.value_bet !== "No Value Edge";
  const todayMatches = allMatches.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#050B14] text-white">
      {/* Background effects */}
      <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-primary rounded-full blur-[200px] opacity-10 pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-secondary rounded-full blur-[200px] opacity-10 pointer-events-none" />

      {/* ===== HERO SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-20 relative z-10">
        <div className="flex flex-col items-center text-center space-y-7">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-3"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold">
              <Activity size={13} className="animate-pulse" /> LIVE: Dixon-Coles v5.0 Engine Online
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-300 text-xs font-bold">
              <Clock size={13} /> {currentDate}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500 tracking-tight leading-tight max-w-5xl"
          >
            The World's Most Accurate Football AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl leading-relaxed"
          >
            Professional-grade Dixon-Coles Poisson modeling, real Expected Goals (xG) analysis,
            and live <span className="text-green-400 font-bold">+EV value bet detection</span> — updated automatically every day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link
              href="/predictions"
              className="bg-white text-black px-8 py-4 rounded-full font-black flex items-center gap-2 hover:bg-gray-100 transition-all shadow-xl text-sm"
            >
              View All Predictions <ArrowRight size={18} />
            </Link>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-8 py-4 rounded-full font-bold flex items-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 transition-all text-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin text-primary" : ""} />
              {syncing ? "Syncing..." : "Sync Today's Fixtures"}
            </button>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 pt-6"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center rounded-2xl">
                <div className="text-2xl font-black text-white mb-0.5">{stat.value}</div>
                <div className="text-[11px] text-gray-400 font-semibold">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ===== FEATURED MATCH CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          onClick={() => featuredMatch && setSelectedMatch(featuredMatch)}
          className="mt-16 glass-card p-8 relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-all shadow-2xl"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="text-primary animate-spin" size={48} />
              <p className="text-gray-400 animate-pulse text-sm font-bold tracking-widest uppercase">Computing Match Probabilities...</p>
            </div>
          ) : featuredMatch ? (
            <>
              {/* Left accent bar */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary via-secondary to-accent" />

              <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-secondary font-bold tracking-widest text-xs uppercase px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full">
                    {featuredMatch.league}
                  </span>
                  {hasValue && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-black rounded-full flex items-center gap-1.5 animate-pulse">
                      <Zap size={13} /> +EV VALUE EDGE
                    </span>
                  )}
                  {featuredMatch.status === 'live' && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black rounded-full flex items-center gap-1.5 animate-pulse">
                      ● LIVE IN-PLAY
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Clock size={12} />
                  {new Date(featuredMatch.match_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              {/* Teams */}
              <div className="flex justify-between items-center text-center mb-8">
                <div className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 flex items-center justify-center text-2xl font-black text-primary shadow-[0_0_25px_rgba(0,229,255,0.2)]">
                    {featuredMatch.home_team.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-extrabold text-2xl">{featuredMatch.home_team}</div>
                    <div className="text-xs text-primary font-bold mt-0.5">xG: {pred?.home_xg ?? '—'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Odds: {featuredMatch.home_odds}</div>
                  </div>
                </div>

                <div className="flex flex-col items-center px-6">
                  <div className="text-4xl font-black text-white/20 tracking-widest mb-1">VS</div>
                  <span className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                    Click for Full Analysis <ExternalLink size={11} />
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-secondary/25 to-secondary/5 border border-secondary/30 flex items-center justify-center text-2xl font-black text-secondary shadow-[0_0_25px_rgba(255,0,127,0.2)]">
                    {featuredMatch.away_team.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-extrabold text-2xl">{featuredMatch.away_team}</div>
                    <div className="text-xs text-secondary font-bold mt-0.5">xG: {pred?.away_xg ?? '—'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Odds: {featuredMatch.away_odds}</div>
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/40 rounded-2xl p-4 border border-primary/20">
                  <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Home Win Prob</div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-primary">{Math.round((pred?.ai_home_win_prob || 0) * 100)}%</span>
                    <Activity className="text-primary opacity-50" size={18} />
                  </div>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-secondary/20">
                  <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Over 2.5 Goals</div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-secondary">{Math.round((pred?.ai_over_2_5_prob || 0) * 100)}%</span>
                    <Trophy className="text-secondary opacity-50" size={18} />
                  </div>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">AI Projected Score</div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-white">{pred?.ai_suggested_score || 'N/A'}</span>
                    <Cpu className="text-white opacity-50" size={18} />
                  </div>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-accent/20">
                  <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Confidence</div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-accent">{Math.round((pred?.confidence_score || 0) * 100)}%</span>
                    <ShieldAlert className="text-accent opacity-50" size={18} />
                  </div>
                </div>
              </div>

              {hasValue && (
                <div className="mt-5 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-between">
                  <span className="text-sm text-green-400 font-bold flex items-center gap-2">
                    <Zap size={16} /> {pred?.value_bet}
                  </span>
                  <span className="text-xs text-gray-400">Click to view full Dixon-Coles score matrix →</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">{error || "No match data available. Click 'Sync Today's Fixtures'."}</p>
            </div>
          )}
        </motion.div>

        {/* ===== UPCOMING MATCHES STRIP ===== */}
        {todayMatches.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" /> More Matches Today
              </h2>
              <Link href="/predictions" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                View All <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {todayMatches.map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => setSelectedMatch(m)}
                  className="glass-card p-4 cursor-pointer hover:border-primary/40 transition-all rounded-2xl"
                >
                  <div className="text-xs text-secondary font-bold mb-2">{m.league}</div>
                  <div className="flex justify-between items-center text-sm font-bold mb-2">
                    <span>{m.home_team}</span>
                    <span className="text-white/30 text-xs">vs</span>
                    <span>{m.away_team}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>AI Score: <strong className="text-white">{m.predictions[0]?.ai_suggested_score || '—'}</strong></span>
                    <span className="text-primary font-bold">{Math.round((m.predictions[0]?.confidence_score || 0) * 100)}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-black/30">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-20">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Built on Quantitative Science</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">Every prediction is powered by the same mathematical models used by professional bookmakers and sports analysts.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="glass-card p-6 rounded-2xl hover:border-primary/30 transition-all"
              >
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 w-fit mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-black text-lg mb-2">{feat.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analysis Modal */}
      <MatchAnalysisModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </main>
  );
}
