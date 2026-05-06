import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const motivational = [
  "Let's finish today's goals.",
  "You're doing great — keep pushing.",
  "One task at a time. You've got this.",
  "Focus on progress, not perfection.",
];

// Animated number counter
const Counter = ({ value }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const step = Math.ceil(end / 20) || 1;
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);

  return <span ref={ref}>{display}</span>;
};

const DailySummaryCard = ({ projects = [] }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const motivation = motivational[new Date().getDay() % motivational.length];

  useEffect(() => {
    api.get('/tasks/stats/daily')
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ completed: 0, pending: 0, overdue: 0, activeProjects: projects.length }));
  }, [projects.length]);

  const total = (stats?.completed || 0) + (stats?.pending || 0);
  const percent = total > 0 ? Math.round((stats.completed / total) * 100) : 0;
  const radius = 36, circumference = 2 * Math.PI * radius;
  const dash = circumference - (percent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Today's Progress</p>
          <h3 className="text-lg font-extrabold text-gray-900">{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h3>
          <p className="text-xs text-gray-400 mt-0.5">{motivation}</p>
        </div>
        {/* Progress ring */}
        <div className="flex-shrink-0 relative">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="#f0fdf4" strokeWidth="8" />
            <circle cx="44" cy="44" r={radius} fill="none"
              stroke="url(#grad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={stats ? dash : circumference}
              transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-extrabold text-emerald-600">{percent}%</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-emerald-50 flex flex-col items-center gap-1">
          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          <p className="text-xl font-extrabold text-emerald-600">
            {stats ? <Counter value={stats.completed} /> : '—'}
          </p>
          <p className="text-[10px] font-bold text-emerald-500">Completed</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-50 flex flex-col items-center gap-1">
          <ClockIcon className="w-4 h-4 text-amber-400" />
          <p className="text-xl font-extrabold text-amber-500">
            {stats ? <Counter value={stats.pending} /> : '—'}
          </p>
          <p className="text-[10px] font-bold text-amber-400">Pending</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-red-50 flex flex-col items-center gap-1">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
          <p className="text-xl font-extrabold text-red-500">
            {stats ? <Counter value={stats.overdue} /> : '—'}
          </p>
          <p className="text-[10px] font-bold text-red-400">Overdue</p>
        </div>
      </div>
    </motion.div>
  );
};

export default DailySummaryCard;
