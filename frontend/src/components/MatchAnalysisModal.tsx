"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, ShieldAlert, Cpu, Trophy, TrendingUp, Zap, BarChart3, CheckCircle2, Target } from 'lucide-react';

interface TopScore {
  score: string;
  probability: number;
}

interface H2HMatch {
  date: string;
  home: string;
  score: string;
  away: string;
  competition: string;
}

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

interface MatchAnalysisModalProps {
  match: Match | null;
  onClose: () => void;
}

export default function MatchAnalysisModal({ match, onClose }: MatchAnalysisModalProps) {
  if (!match) return null;

  const pred = match.predictions[0] || {};
  let parsedTopScores: TopScore[] = [];
  if (pred.top_scores) {
    try {
      parsedTopScores = JSON.parse(pred.top_scores);
    } catch (e) {
      console.error("Failed to parse top_scores", e);
    }
  }

  let parsedH2H: H2HMatch[] = [];
  if (pred.h2h_data) {
    try {
      parsedH2H = JSON.parse(pred.h2h_data);
    } catch (e) {
      console.error("Failed to parse h2h_data", e);
    }
  }

  let parsedTrends: string[] = [];
  if (pred.trends) {
    try {
      parsedTrends = JSON.parse(pred.trends);
    } catch (e) {
      console.error("Failed to parse trends", e);
    }
  }

  const homeXg = pred.home_xg ?? 1.8;
  const awayXg = pred.away_xg ?? 1.1;
  const homeXgWidth = Math.round((homeXg / (homeXg + awayXg)) * 100);
  const awayXgWidth = 100 - homeXgWidth;

  const hasValueEdge = pred.value_bet && pred.value_bet !== "No Value Edge";

  const homeFormList = match.home_form ? match.home_form.split(',') : ['W','W','D','L','W'];
  const awayFormList = match.away_form ? match.away_form.split(',') : ['D','W','W','L','D'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#09111E] border border-white/10 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden my-8"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>

          {/* League, Weather & Status Header */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20">
              {match.league}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              match.status === 'live' ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse' : 'bg-white/5 text-gray-400'
            }`}>
              {match.status === 'live' ? '● LIVE IN-PLAY' : 'UPCOMING MATCH'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-cyan-400 border border-white/10 flex items-center gap-1.5">
              🌤️ {match.venue || 'Stadium'} • {match.weather_temp || '18°C'} {match.weather_desc || 'Clear'}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(match.match_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>

          {/* Teams & Form Header */}
          <div className="grid grid-cols-3 items-center text-center pb-6 border-b border-white/10">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center font-black text-2xl text-primary mb-2 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                {match.home_team.substring(0, 3).toUpperCase()}
              </div>
              <h3 className="font-bold text-xl">{match.home_team}</h3>
              <div className="flex gap-1 mt-2">
                {homeFormList.map((f, i) => (
                  <span key={i} className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${
                    f === 'W' ? 'bg-green-500 text-black' : f === 'D' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                  }`}>
                    {f}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400 font-semibold mt-2">Odds: {match.home_odds}</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-black tracking-widest text-primary uppercase mb-1">Dixon-Coles AI</span>
              <span className="text-3xl font-black tracking-tighter text-white">
                {match.home_score !== undefined && match.home_score !== null ? `${match.home_score} - ${match.away_score}` : 'VS'}
              </span>
              <span className="text-xs text-gray-400 font-semibold mt-1">Draw: {match.draw_odds}</span>
              <span className="mt-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-black">
                HT/FT: {pred.ht_ft_pred || '1/1'}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 flex items-center justify-center font-black text-2xl text-secondary mb-2 shadow-[0_0_15px_rgba(255,0,127,0.2)]">
                {match.away_team.substring(0, 3).toUpperCase()}
              </div>
              <h3 className="font-bold text-xl">{match.away_team}</h3>
              <div className="flex gap-1 mt-2">
                {awayFormList.map((f, i) => (
                  <span key={i} className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${
                    f === 'W' ? 'bg-green-500 text-black' : f === 'D' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                  }`}>
                    {f}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400 font-semibold mt-2">Odds: {match.away_odds}</span>
            </div>
          </div>

          {/* Expected Value (+EV) Alert if present */}
          {hasValueEdge && (
            <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 via-green-500/20 to-green-500/10 border border-green-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/20 text-green-400">
                  <Zap size={22} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-green-400 text-sm">Identified +EV Edge</h4>
                  <p className="text-xs text-gray-300">{pred.value_bet}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-500 text-black text-xs font-black rounded-lg uppercase">Value Bet</span>
            </div>
          )}

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            
            {/* Win Probability Distribution */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" /> 1X2 Probabilities Matrix
              </h4>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{match.home_team} Win</span>
                  <span className="text-primary font-bold">{Math.round((pred.ai_home_win_prob || 0) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.round((pred.ai_home_win_prob || 0) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Draw</span>
                  <span className="text-gray-300 font-bold">{Math.round((pred.ai_draw_prob || 0) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gray-400" style={{ width: `${Math.round((pred.ai_draw_prob || 0) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{match.away_team} Win</span>
                  <span className="text-secondary font-bold">{Math.round((pred.ai_away_win_prob || 0) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${Math.round((pred.ai_away_win_prob || 0) * 100)}%` }} />
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-black/30 p-2 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">OVER 2.5 GOALS</span>
                  <span className="font-bold text-white text-base">{Math.round((pred.ai_over_2_5_prob || 0) * 100)}%</span>
                </div>
                <div className="bg-black/30 p-2 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">BOTH TEAMS TO SCORE</span>
                  <span className="font-bold text-white text-base">{Math.round((pred.ai_btts_prob || 0) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Expected Goals (xG) & Top Score Heatmap */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Target size={16} className="text-secondary" /> Expected Goals (xG) & Dixon Score Heatmap
              </h4>

              {/* xG Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-primary">{match.home_team}: {homeXg} xG</span>
                  <span className="text-secondary">{match.away_team}: {awayXg} xG</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                  <div className="h-full bg-primary" style={{ width: `${homeXgWidth}%` }} />
                  <div className="h-full bg-secondary" style={{ width: `${awayXgWidth}%` }} />
                </div>
              </div>

              {/* Top Projected Scores Grid */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Top 5 Dixon-Coles Projected Scores</span>
                <div className="grid grid-cols-5 gap-2">
                  {parsedTopScores.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2 rounded-xl text-center border ${
                        idx === 0 ? 'bg-primary/20 border-primary/50 ring-1 ring-primary/40' : 'bg-black/30 border-white/5'
                      }`}
                    >
                      <span className="block text-xs font-black text-white">{item.score}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{item.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggested Score Badge */}
              <div className="p-3 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">AI Suggested Score</span>
                <span className="text-xl font-black text-white px-3 py-0.5 rounded-lg bg-black/50 border border-white/20">
                  {pred.ai_suggested_score}
                </span>
              </div>
            </div>
          </div>

          {/* Statistical Trends & H2H Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Trends Box */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <h4 className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> Statistical Key Trends
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                {parsedTrends.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* H2H Box */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Trophy size={16} /> Head to Head (H2H) Past Matches
              </h4>
              <div className="space-y-2 text-xs">
                {parsedH2H.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400 text-[10px]">{h.date}</span>
                    <span className="font-bold text-white">{h.home} <span className="text-primary px-1">{h.score}</span> {h.away}</span>
                    <span className="text-[10px] text-gray-400">{h.competition}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Explanation Text */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
              <Cpu size={16} /> Dixon-Coles Model Tactical Breakdown
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {pred.ai_explanation}
            </p>
          </div>

          {/* Footer Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-gray-400">Confidence Rating: <strong className="text-white">{Math.round((pred.confidence_score || 0) * 100)}%</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-accent" />
              <span className="text-gray-400">Risk Profile: <strong className="text-white capitalize">{pred.risk_level || 'Medium'}</strong></span>
            </div>

            <button
              onClick={onClose}
              className="ml-auto px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors"
            >
              Close Analysis
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
