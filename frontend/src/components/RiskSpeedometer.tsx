import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskSpeedometerProps {
  score: number; // 0 to 100
  classification: 'Safe' | 'Risky' | 'Dangerous';
  recommendations: string[];
}

export default function RiskSpeedometer({ score, classification, recommendations }: RiskSpeedometerProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Smooth numerical count-up animation
  useEffect(() => {
    let start = animatedScore;
    const end = score;
    if (start === end) return;

    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out quad formula
      const ease = progress * (2 - progress);
      const current = Math.round(start + (end - start) * ease);
      
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Map 0-100 score to degrees for speedometer needle (-90deg for 0, +90deg for 100)
  const minAngle = -90;
  const maxAngle = 90;
  const needleRotation = minAngle + (animatedScore / 100) * (maxAngle - minAngle);

  // Define colors based on severity
  const getThemeColors = () => {
    switch (classification) {
      case 'Dangerous':
        return {
          glowClass: 'shadow-glow-red border-red-500/30 text-rose-450 bg-rose-500/10',
          textClass: 'text-rose-500',
          borderClass: 'border-rose-500/30',
          gaugeGradient: 'url(#redGlow)',
          icon: <AlertCircle className="w-5 h-5 text-rose-500 animate-bounce" />
        };
      case 'Risky':
        return {
          glowClass: 'shadow-glow-gold border-amber-500/30 text-amber-400 bg-amber-500/10',
          textClass: 'text-amber-400',
          borderClass: 'border-amber-500/30',
          gaugeGradient: 'url(#goldGlow)',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      default:
        return {
          glowClass: 'shadow-glow-green border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
          textClass: 'text-emerald-400',
          borderClass: 'border-emerald-500/30',
          gaugeGradient: 'url(#greenGlow)',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
        };
    }
  };

  const theme = getThemeColors();

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col items-center justify-between h-full relative overflow-hidden">
      {/* Visual cyber neon decoration lines */}
      <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
      <div className="absolute top-0 left-6 w-[1px] h-8 bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

      <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-450 flex items-center">
          <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-ping" />
          Smart Risk Engine
        </h3>
        <span className={`px-3 py-1 text-[10px] font-extrabold rounded-lg border uppercase tracking-wider font-mono ${theme.glowClass}`}>
          {classification}
        </span>
      </div>

      {/* Radial Speedometer Gauge */}
      <div className="relative w-48 h-28 flex items-center justify-center mb-4 mt-2">
        <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
          <defs>
            {/* Gradients */}
            <linearGradient id="gaugeBg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            
            <linearGradient id="greenGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            
            <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>

            <linearGradient id="redGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>

            {/* Neon Glow Filters */}
            <filter id="neonShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Outer Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#161e31"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Color Zones Track (Split segments just for visual indicator) */}
          <path
            d="M 10 50 A 40 40 0 0 1 36.6 26.6"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            opacity="0.35"
          />
          <path
            d="M 36.6 26.6 A 40 40 0 0 1 63.4 26.6"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            opacity="0.35"
          />
          <path
            d="M 63.4 26.6 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="3"
            opacity="0.35"
          />

          {/* Dynamic filled arc path */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={theme.gaugeGradient}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.6" // (pi * r) which is 3.1415 * 40 = 125.6
            strokeDashoffset={125.6 - (animatedScore / 100) * 125.6}
            className="transition-all duration-300 ease-out"
          />

          {/* Dial Center Bolt */}
          <circle cx="50" cy="50" r="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

          {/* Animated Needle pointer */}
          <motion.g 
            animate={{ rotate: needleRotation }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            style={{ originX: '50px', originY: '50px' }}
          >
            {/* The sharp triangular cyber pointer needle */}
            <polygon 
              points="48,50 50,14 52,50" 
              fill={score > 70 ? '#f43f5e' : score > 40 ? '#f59e0b' : '#38bdf8'}
              className="drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]"
            />
            {/* High-tech center accent cap */}
            <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
          </motion.g>
        </svg>

        {/* Floating live score numbers inside center of dial */}
        <div className="absolute bottom-0 flex flex-col items-center select-none">
          <span className="text-4xl font-black font-mono tracking-tight bg-gradient-to-b from-white to-slate-350 bg-clip-text text-transparent drop-shadow-sm">
            {animatedScore}
          </span>
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-[-2px]">Risk Factor</span>
        </div>
      </div>

      {/* Action Recommendation list based on score */}
      <div className="w-full bg-slate-950/70 rounded-2xl border border-slate-800/80 p-3 space-y-2 mt-2">
        <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wide block mb-1 flex items-center">
          {theme.icon}
          <span className="ml-1.5">Intelligence Advisory</span>
        </span>
        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
          {recommendations.map((rec, idx) => (
            <p key={idx} className="text-[11px] text-slate-350 leading-relaxed font-medium">
              • {rec}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
