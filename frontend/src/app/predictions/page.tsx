"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Search, RefreshCw, Zap, ChevronRight,
  Calendar, Clock, Flame, BookmarkPlus, BookmarkCheck, Globe, ChevronDown,
  ChevronUp, SlidersHorizontal, X, Trophy
} from 'lucide-react';
import axios from 'axios';
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

const LEAGUE_GROUPS = [
  {
    group: "Europe — Top 5",
    icon: "🏆",
    leagues: [
      { name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { name: "La Liga", flag: "🇪🇸" },
      { name: "Bundesliga", flag: "🇩🇪" },
      { name: "Serie A", flag: "🇮🇹" },
      { name: "Ligue 1", flag: "🇫🇷" },
    ]
  },
  {
    group: "UEFA Competitions",
    icon: "⭐",
    leagues: [
      { name: "UEFA Champions League", flag: "🌟" },
      { name: "UEFA Europa League", flag: "🟠" },
      { name: "UEFA Conference League", flag: "🔵" },
      { name: "UEFA Nations League", flag: "🇪🇺" },
    ]
  },
  {
    group: "Europe — Other",
    icon: "🌍",
    leagues: [
      { name: "Eredivisie", flag: "🇳🇱" },
      { name: "Primeira Liga", flag: "🇵🇹" },
      { name: "Scottish Premiership", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
      { name: "Belgian Pro League", flag: "🇧🇪" },
      { name: "Süper Lig", flag: "🇹🇷" },
      { name: "Championship", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { name: "2. Bundesliga", flag: "🇩🇪" },
      { name: "Serie B", flag: "🇮🇹" },
      { name: "La Liga 2", flag: "🇪🇸" },
      { name: "Ligue 2", flag: "🇫🇷" },
      { name: "Swiss Super League", flag: "🇨🇭" },
      { name: "Austrian Bundesliga", flag: "🇦🇹" },
      { name: "Czech First League", flag: "🇨🇿" },
      { name: "PKO BP Ekstraklasa", flag: "🇵🇱" },
      { name: "Danish Superliga", flag: "🇩🇰" },
      { name: "Allsvenskan", flag: "🇸🇪" },
      { name: "Eliteserien", flag: "🇳🇴" },
      { name: "Super League Greece", flag: "🇬🇷" },
    ]
  },
  {
    group: "Americas",
    icon: "🌎",
    leagues: [
      { name: "MLS", flag: "🇺🇸" },
      { name: "Liga MX", flag: "🇲🇽" },
      { name: "Brasileirão Serie A", flag: "🇧🇷" },
      { name: "Argentine Primera División", flag: "🇦🇷" },
      { name: "Categoría Primera A", flag: "🇨🇴" },
      { name: "Chilean Primera División", flag: "🇨🇱" },
    ]
  },
  {
    group: "Middle East & Africa",
    icon: "🌙",
    leagues: [
      { name: "Saudi Pro League", flag: "🇸🇦" },
      { name: "UAE Pro League", flag: "🇦🇪" },
      { name: "Egyptian Premier League", flag: "🇪🇬" },
    ]
  },
  {
    group: "Asia & Oceania",
    icon: "🌏",
    leagues: [
      { name: "J1 League", flag: "🇯🇵" },
      { name: "K League 1", flag: "🇰🇷" },
      { name: "Chinese Super League", flag: "🇨🇳" },
      { name: "A-League", flag: "🇦🇺" },
    ]
  },
];

const MARKETS = [
  { key: 'all', label: 'All Predictions' },
  { key: '1x2', label: '1X2 Match Winner' },
  { key: 'over_under', label: 'O/U 2.5 Goals' },
  { key: 'btts', label: 'Both Teams To Score' },
  { key: 'value_bets', label: '⚡ +EV Value Edges' },
];

const TIMEFRAMES = [
  { key: 'all', label: 'All Dates', icon: <Calendar size={13} /> },
  { key: 'yesterday', label: 'Yesterday', icon: <Clock size={13} /> },
  { key: 'today', label: 'Today (Live)', icon: <Clock size={13} /> },
  { key: 'tomorrow', label: 'Tomorrow', icon: <Calendar size={13} /> },
  { key: 'live', label: '🔴 In-Play Live', icon: <Flame size={13} /> },
];

function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: 'bg-green-500/80 text-white',
    D: 'bg-yellow-500/80 text-black',
    L: 'bg-red-500/80 text-white',
  };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-black ${colors[result] || 'bg-gray-600 text-white'}`}>
      {result}
    </span>
  );
}

export default function PredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueSearchQuery, setLeagueSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [timeframe, setTimeframe] = useState('today');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
        ' · ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  const fetchMatches = useCallback(async (tf = timeframe, market = selectedMarket, league = selectedLeague) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ timeframe: tf, market });
      if (league !== 'All') params.set('league', league);
      const response = await axios.get(`http://localhost:8000/api/v1/matches/?${params}`);
      setMatches(response.data);
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, selectedMarket, selectedLeague]);

  useEffect(() => {
    fetchMatches(timeframe, selectedMarket, selectedLeague);
  }, [timeframe, selectedMarket, selectedLeague]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches(timeframe, selectedMarket, selectedLeague);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeframe, selectedMarket, selectedLeague, fetchMatches]);

  const handleSyncLive = async () => {
    try {
      setSyncing(true);
      const response = await axios.post('http://localhost:8000/api/v1/matches/sync');
      setMatches(response.data);
    } catch (err) {
      console.error("Error syncing:", err);
    } finally {
      setSyncing(false);
    }
  };

  const toggleSavedBet = async (matchId: number) => {
    try {
      if (savedIds.has(matchId)) {
        await axios.delete(`http://localhost:8000/api/v1/user/favorites/${matchId}`);
        setSavedIds(prev => { const n = new Set(prev); n.delete(matchId); return n; });
      } else {
        await axios.post(`http://localhost:8000/api/v1/user/favorites/${matchId}`);
        setSavedIds(prev => new Set(prev).add(matchId));
      }
    } catch (err) {
      // silently handle
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const n = new Set(prev);
      n.has(group) ? n.delete(group) : n.add(group);
      return n;
    });
  };

  const selectLeague = (league: string) => {
    setSelectedLeague(league);
    setMobileFiltersOpen(false);
  };

  const filtered = matches.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.home_team.toLowerCase().includes(q) ||
      m.away_team.toLowerCase().includes(q) ||
      m.league.toLowerCase().includes(q);
  });

  const leagueCounts = matches.reduce<Record<string, number>>((acc, m) => {
    acc[m.league] = (acc[m.league] || 0) + 1;
    return acc;
  }, {});

  const liveCount = matches.filter(m => m.status === 'live').length;
  const valueBetsCount = matches.filter(m => m.predictions?.[0]?.value_bet && m.predictions[0].value_bet !== "No Value Edge").length;

  const LeagueSidebar = () => (
    <aside className={`${sidebarCollapsed ? 'w-12' : 'w-64'} flex-shrink-0 transition-all duration-300 hidden lg:block`}>
      <div className="sticky top-20 bg-[#09111E] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
          {!sidebarCollapsed && (
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={14} className="text-primary animate-spin" style={{ animationDuration: '10s' }} /> Global Leagues
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors ml-auto"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <SlidersHorizontal size={14} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="overflow-y-auto max-h-[75vh] scrollbar-thin p-2 space-y-2">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
              <input
                type="text"
                placeholder="Find league..."
                value={leagueSearchQuery}
                onChange={e => setLeagueSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-1.5 pl-7 pr-3 text-[11px] text-white focus:outline-none focus:border-primary/50"
              />
            </div>

            <button
              onClick={() => selectLeague('All')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedLeague === 'All'
                  ? 'bg-gradient-to-r from-primary/30 to-secondary/30 text-white border border-primary/50 shadow-md'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🌐</span> All Leagues
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-200 font-black">
                {matches.length}
              </span>
            </button>

            {liveCount > 0 && (
              <button
                onClick={() => { setTimeframe('live'); selectLeague('All'); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Live Matches
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/30 text-red-200 font-black">
                  {liveCount}
                </span>
              </button>
            )}

            {LEAGUE_GROUPS.map((group) => {
              const groupLeagues = group.leagues.filter(l =>
                !leagueSearchQuery || l.name.toLowerCase().includes(leagueSearchQuery.toLowerCase())
              );
              if (leagueSearchQuery && groupLeagues.length === 0) return null;

              return (
                <div key={group.group} className="border-t border-white/5 pt-1">
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-black text-gray-400 hover:text-gray-200 uppercase tracking-wider transition-colors"
                  >
                    <span className="flex items-center gap-1.5">{group.icon} {group.group}</span>
                    {collapsedGroups.has(group.group) ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                  </button>
                  {!collapsedGroups.has(group.group) && (
                    <div className="space-y-0.5 mt-0.5">
                      {groupLeagues.map(({ name, flag }) => {
                        const count = leagueCounts[name] || 0;
                        return (
                          <button
                            key={name}
                            onClick={() => selectLeague(name)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                              selectedLeague === name
                                ? 'bg-primary/20 text-primary font-black border border-primary/40'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span>{flag}</span>
                              <span className="truncate">{name}</span>
                            </span>
                            {count > 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-bold ml-1">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#040811] text-white pb-16 font-sans">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[180px] pointer-events-none" />

      {/* HEADER BANNER */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-white/5 via-white/2 to-transparent backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-8 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-primary text-xs font-black mb-2 shadow-lg">
                <Activity size={13} className="animate-pulse text-cyan-400" /> Real Fixtures Pipeline · {matches.length} Real Matches Active
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">Football Predictions</span>
              </h1>
              <p className="text-gray-400 text-xs flex items-center gap-2 mt-1 font-semibold">
                <Clock size={12} className="text-cyan-400" /> {currentDateTime}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 font-bold text-xs shadow-md"
              >
                <Globe size={14} className="text-primary" /> Filter Leagues
              </button>
              <button
                onClick={handleSyncLive}
                disabled={syncing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border border-primary/40 font-black text-xs text-primary transition-all disabled:opacity-50 shadow-lg shadow-primary/10"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin text-primary" : "text-primary"} />
                {syncing ? "Syncing API..." : "Live Refresh"}
              </button>
            </div>
          </div>

          {/* TOP STATS TICKER CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Trophy size={18} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">AI Accuracy</span>
                <span className="text-lg font-black text-white">84.2% <span className="text-[10px] text-green-400 font-bold">Conf</span></span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Globe size={18} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">Global Real Matches</span>
                <span className="text-lg font-black text-white">{matches.length} <span className="text-[10px] text-gray-400 font-semibold">Fixtures</span></span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Flame size={18} className={liveCount > 0 ? "animate-pulse" : ""} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">In-Play Live</span>
                <span className="text-lg font-black text-white">{liveCount} <span className="text-[10px] text-red-400 font-bold">Live Games</span></span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
                <Zap size={18} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">+EV Value Bets</span>
                <span className="text-lg font-black text-white">{valueBetsCount} <span className="text-[10px] text-green-400 font-bold">Edges</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-6 flex gap-6">

        {/* Sidebar */}
        <LeagueSidebar />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Markets Selection Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MARKETS.map(m => (
              <button
                key={m.key}
                onClick={() => setSelectedMarket(m.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedMarket === m.key
                    ? 'bg-gradient-to-r from-primary via-purple-500 to-secondary text-black shadow-lg ring-1 ring-white/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Timeframe & View Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white/5 p-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                    timeframe === tf.key
                      ? 'bg-white text-black border-transparent shadow-lg font-black'
                      : 'bg-transparent text-gray-400 border-transparent hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tf.icon} {tf.label}
                  {tf.key === 'live' && liveCount > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black animate-pulse">
                      {liveCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${viewMode === 'table' ? 'bg-primary text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  Forebet Table
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${viewMode === 'grid' ? 'bg-primary text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  Match Cards
                </button>
              </div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search team name, league, or country..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors placeholder-gray-500 shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Bar Counter */}
          {!loading && (
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>
                Showing <strong className="text-white font-black">{filtered.length}</strong> real matches
                {selectedLeague !== 'All' && (
                  <> · League: <span className="text-primary font-black">{selectedLeague}</span>
                    <button onClick={() => setSelectedLeague('All')} className="ml-1 text-gray-500 hover:text-white">
                      <X size={12} />
                    </button>
                  </>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Live Real-Time Dixon-Coles Model
              </span>
            </div>
          )}

          {/* Matches List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white/5 rounded-3xl border border-white/10">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-2 border-4 border-secondary/40 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
              </div>
              <p className="text-gray-300 font-black tracking-widest uppercase text-xs animate-pulse">Running Dixon-Coles Poisson Simulation...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4 text-center bg-white/5 rounded-3xl border border-white/10">
              <Calendar className="text-gray-600" size={56} />
              <div>
                <h3 className="text-xl font-black text-gray-200">No matches found</h3>
                <p className="text-gray-500 text-xs mt-1">Try selecting a different date timeframe or clearing search filters</p>
              </div>
              <button
                onClick={() => { setTimeframe('all'); setSelectedMarket('all'); setSearchQuery(''); setSelectedLeague('All'); }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-black font-black hover:opacity-90 transition-opacity text-xs uppercase tracking-wider"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* FOREBET STYLE TABLE VIEW */
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#080E1A] shadow-2xl">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-white/5 text-gray-400 border-b border-white/10 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-4 px-4">Time / League</th>
                    <th className="py-4 px-4">Matchup & Form</th>
                    <th className="py-4 px-3 text-center">1X2 Probabilities Bar</th>
                    <th className="py-4 px-3 text-center">Predicted Score</th>
                    <th className="py-4 px-3 text-center">O/U 2.5</th>
                    <th className="py-4 px-3 text-center">BTTS</th>
                    <th className="py-4 px-3 text-center">HT/FT</th>
                    <th className="py-4 px-3 text-center">Confidence</th>
                    <th className="py-4 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(match => {
                    const pred = match.predictions[0] || {} as Partial<Prediction>;
                    const hProb = Math.round((pred.ai_home_win_prob || 0) * 100);
                    const dProb = Math.round((pred.ai_draw_prob || 0) * 100);
                    const aProb = Math.round((pred.ai_away_win_prob || 0) * 100);
                    const maxProb = Math.max(hProb, dProb, aProb);
                    const hasValue = pred.value_bet && pred.value_bet !== "No Value Edge";
                    const hForm = match.home_form?.split(',') || [];
                    const aForm = match.away_form?.split(',') || [];
                    const conf = Math.round((pred.confidence_score || 0) * 100);

                    return (
                      <motion.tr
                        key={match.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setSelectedMatch(match)}
                        className={`cursor-pointer transition-colors group ${
                          match.status === 'live'
                            ? 'hover:bg-red-500/10 bg-red-500/5'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-black text-white text-xs flex items-center gap-1.5">
                            <Clock size={11} className="text-cyan-400" />
                            {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-cyan-400 font-bold mt-0.5 truncate max-w-[130px]">
                            {match.league}
                          </div>
                          <div className="text-[9px] text-gray-500">
                            {new Date(match.match_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-sm text-white">
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center text-[10px] font-black text-primary">
                                  {match.home_team.substring(0, 2).toUpperCase()}
                                </span>
                                <span>{match.home_team}</span>
                              </div>
                              <div className="flex gap-0.5">
                                {hForm.slice(-3).map((r, i) => <FormBadge key={i} result={r} />)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-sm text-white">
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/40 flex items-center justify-center text-[10px] font-black text-secondary">
                                  {match.away_team.substring(0, 2).toUpperCase()}
                                </span>
                                <span>{match.away_team}</span>
                              </div>
                              <div className="flex gap-0.5">
                                {aForm.slice(-3).map((r, i) => <FormBadge key={i} result={r} />)}
                              </div>
                            </div>
                          </div>

                          {match.status === 'live' && (
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-black animate-pulse">
                              ● LIVE ({match.home_score ?? 0} - {match.away_score ?? 0})
                            </div>
                          )}
                          {hasValue && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-black border border-green-500/30">
                              <Zap size={9} /> +EV Edge
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center min-w-[170px]">
                          <div className="flex justify-between text-[10px] font-black mb-1">
                            <span className={hProb === maxProb ? 'text-cyan-400' : 'text-gray-400'}>1: {hProb}%</span>
                            <span className={dProb === maxProb ? 'text-yellow-400' : 'text-gray-400'}>X: {dProb}%</span>
                            <span className={aProb === maxProb ? 'text-pink-400' : 'text-gray-400'}>2: {aProb}%</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden flex shadow-inner">
                            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${hProb}%` }} />
                            <div className="h-full bg-gray-400 transition-all" style={{ width: `${dProb}%` }} />
                            <div className="h-full bg-pink-500 transition-all" style={{ width: `${aProb}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-semibold">
                            <span>@{match.home_odds}</span>
                            <span>@{match.draw_odds}</span>
                            <span>@{match.away_odds}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-block px-3 py-1 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/20 text-white font-black text-sm shadow-md">
                            {pred.ai_suggested_score || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`font-black text-xs ${(pred.ai_over_2_5_prob || 0) > 0.55 ? 'text-green-400' : 'text-gray-400'}`}>
                            {Math.round((pred.ai_over_2_5_prob || 0) * 100)}%
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`font-black text-xs ${(pred.ai_btts_prob || 0) > 0.55 ? 'text-green-400' : 'text-gray-400'}`}>
                            {Math.round((pred.ai_btts_prob || 0) * 100)}%
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300 font-black text-xs">
                            {pred.ht_ft_pred || '1/1'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black border ${
                              conf >= 78 ? 'bg-green-500/15 border-green-500/30 text-green-400' :
                              conf >= 65 ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
                              'bg-red-500/15 border-red-500/30 text-red-400'
                            }`}>
                              {conf}%
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={e => { e.stopPropagation(); toggleSavedBet(match.id); }}
                              className={`p-2 rounded-xl transition-colors border ${
                                savedIds.has(match.id)
                                  ? 'bg-secondary/20 border-secondary/40 text-secondary'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              {savedIds.has(match.id) ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                            </button>
                            <button className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-black font-black text-xs transition-all shadow-md shadow-primary/10">
                              Analyze
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* MATCH CARDS GRID VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((match) => {
                const pred = match.predictions[0] || {} as Partial<Prediction>;
                const hasValue = pred.value_bet && pred.value_bet !== "No Value Edge";
                const isSaved = savedIds.has(match.id);
                const hProb = Math.round((pred.ai_home_win_prob || 0) * 100);
                const dProb = Math.round((pred.ai_draw_prob || 0) * 100);
                const aProb = Math.round((pred.ai_away_win_prob || 0) * 100);

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedMatch(match)}
                    className="cursor-pointer bg-[#09111E] border border-white/10 hover:border-primary/50 rounded-3xl p-5 transition-all hover:shadow-2xl hover:shadow-primary/10 group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {match.league}
                      </span>
                      <div className="flex items-center gap-2">
                        {match.status === 'live' ? (
                          <span className="flex items-center gap-1 text-[10px] font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md border border-red-500/30 animate-pulse">
                            ● LIVE ({match.home_score} - {match.away_score})
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold">
                            {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); toggleSavedBet(match.id); }}
                          className={`p-1.5 rounded-lg border transition-colors ${isSaved ? 'bg-secondary/20 border-secondary/40 text-secondary' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                        >
                          {isSaved ? <BookmarkCheck size={13} /> : <BookmarkPlus size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center text-center my-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center font-black text-primary text-base mb-1">
                          {match.home_team.substring(0, 3).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-white line-clamp-1">{match.home_team}</span>
                        <span className="text-[10px] text-gray-500 font-semibold">@{match.home_odds}</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Pred Score</span>
                        <span className="text-2xl font-black text-white px-3 py-1 rounded-xl bg-white/5 border border-white/10 my-1">
                          {pred.ai_suggested_score || 'VS'}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold">HT/FT: {pred.ht_ft_pred || '1/1'}</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 flex items-center justify-center font-black text-secondary text-base mb-1">
                          {match.away_team.substring(0, 3).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-white line-clamp-1">{match.away_team}</span>
                        <span className="text-[10px] text-gray-500 font-semibold">@{match.away_odds}</span>
                      </div>
                    </div>

                    <div className="my-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-black">
                        <span className="text-cyan-400">1: {hProb}%</span>
                        <span className="text-gray-400">X: {dProb}%</span>
                        <span className="text-pink-400">2: {aProb}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
                        <div className="h-full bg-cyan-400" style={{ width: `${hProb}%` }} />
                        <div className="h-full bg-gray-400" style={{ width: `${dProb}%` }} />
                        <div className="h-full bg-pink-500" style={{ width: `${aProb}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-center text-xs">
                      <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                        <span className="text-gray-400 text-[10px] block">OVER 2.5</span>
                        <span className="font-black text-white">{Math.round((pred.ai_over_2_5_prob || 0) * 100)}%</span>
                      </div>
                      <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                        <span className="text-gray-400 text-[10px] block">BTTS</span>
                        <span className="font-black text-white">{Math.round((pred.ai_btts_prob || 0) * 100)}%</span>
                      </div>
                    </div>

                    {hasValue && (
                      <div className="mt-3 p-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1"><Zap size={12} /> {pred.value_bet}</span>
                        <span className="text-[9px] bg-green-500 text-black font-black px-1.5 py-0.5 rounded">VALUE</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-4/5 max-w-md bg-[#09111E] h-full p-6 overflow-y-auto border-l border-white/10 text-white"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Globe className="text-primary" /> Filter by League
                </h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => selectLeague('All')}
                  className="w-full text-left p-3 rounded-xl bg-white/5 font-bold text-sm hover:bg-white/10"
                >
                  🌐 All Leagues ({matches.length})
                </button>

                {LEAGUE_GROUPS.map(group => (
                  <div key={group.group} className="space-y-2">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">{group.icon} {group.group}</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {group.leagues.map(({ name, flag }) => (
                        <button
                          key={name}
                          onClick={() => selectLeague(name)}
                          className={`p-2.5 rounded-xl text-left text-xs font-bold transition-colors ${selectedLeague === name ? 'bg-primary text-black' : 'bg-white/5 text-gray-300'}`}
                        >
                          {flag} {name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MATCH ANALYSIS MODAL */}
      <MatchAnalysisModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}
