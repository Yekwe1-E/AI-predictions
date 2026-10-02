"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Activity, Bookmark, ShieldCheck, UserCheck } from 'lucide-react';
import axios from 'axios';

interface UserActivity {
  id: number;
  action: string;
  details?: string;
  timestamp: string;
}

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityModal({ isOpen, onClose }: ActivityModalProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/v1/user/activities');
      setActivities(res.data);
    } catch (e) {
      console.error("Failed to fetch activities", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ACCOUNT_REGISTER':
      case 'ACCOUNT_LOGIN':
        return <UserCheck className="text-green-400" size={16} />;
      case 'SAVED_BET':
        return <Bookmark className="text-secondary" size={16} />;
      default:
        return <Activity className="text-primary" size={16} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-[#09111E] border border-white/10 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden my-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">System Activity Log</h3>
              <p className="text-xs text-gray-400">Real-time persistent user activity audit feed</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 animate-pulse text-sm">
              Loading user activity log...
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {activities.map((act) => (
                <div 
                  key={act.id} 
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 hover:border-primary/30 transition-colors"
                >
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 mt-0.5">
                    {getActionIcon(act.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{act.action.replace('_', ' ')}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{act.details || 'User activity recorded'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              No recorded activity logs yet.
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-400">
            <span className="flex items-center gap-1 text-green-400 font-semibold">
              <ShieldCheck size={14} /> Persistent Security Encryption
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
            >
              Close Log
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
