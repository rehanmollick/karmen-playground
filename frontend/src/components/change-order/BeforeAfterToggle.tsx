'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeAfterToggleProps {
  delayDays: number;
  onToggle: (showImpacted: boolean) => void;
}

export default function BeforeAfterToggle({
  delayDays,
  onToggle,
}: BeforeAfterToggleProps) {
  const [showImpacted, setShowImpacted] = useState(false);
  const [animatedDelay, setAnimatedDelay] = useState(0);

  // Animate delay counter when switching to "After"
  useEffect(() => {
    if (showImpacted && delayDays !== 0) {
      let start = 0;
      const step = Math.max(1, Math.ceil(Math.abs(delayDays) / 20));
      const interval = setInterval(() => {
        start += step;
        if (start >= Math.abs(delayDays)) {
          setAnimatedDelay(delayDays);
          clearInterval(interval);
        } else {
          setAnimatedDelay(delayDays > 0 ? start : -start);
        }
      }, 40);
      return () => clearInterval(interval);
    } else {
      setAnimatedDelay(0);
    }
  }, [showImpacted, delayDays]);

  function toggle(val: boolean) {
    setShowImpacted(val);
    onToggle(val);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex rounded-[var(--radius-sm)] border border-[var(--border-default)] overflow-hidden">
        <button
          onClick={() => toggle(false)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            !showImpacted
              ? 'bg-[var(--blue-primary)] text-white'
              : 'bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          Before
        </button>
        <button
          onClick={() => toggle(true)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            showImpacted
              ? 'bg-[var(--blue-primary)] text-white'
              : 'bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          After
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showImpacted && animatedDelay !== 0 && (
          <motion.div
            key="counter"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
              animatedDelay > 0
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            <motion.span
              key={animatedDelay}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
            >
              {animatedDelay > 0 ? '+' : ''}{animatedDelay}d
            </motion.span>
            <span className="font-normal opacity-70">
              {animatedDelay > 0 ? 'delay' : 'savings'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
