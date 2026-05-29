'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingAnimation from './LoadingAnimation';

/**
 * Loading state for the initial project fetch. The backend runs on a free
 * tier that sleeps after inactivity, so the first request can take ~30s while
 * it wakes up. After a few seconds we surface an explanation so visitors don't
 * assume the demo is broken.
 */
export default function ColdStartLoader() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const showColdStart = elapsed >= 4;

  return (
    <div className="w-full max-w-md mx-auto px-6">
      <LoadingAnimation message="Loading projects…" rows={3} />

      <AnimatePresence>
        {showColdStart && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 border-2 border-[var(--blue-primary)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  Waking up the server…
                </p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  The backend runs on a free tier and goes to sleep after a period of
                  inactivity. The first load can take up to ~30 seconds while it spins
                  back up — hang tight, this only happens once.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
