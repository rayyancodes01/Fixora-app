import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'diamond' | 'reveal' | 'wipe' | 'done'>('diamond');

  // Stage timeline:
  // 0 - 2000ms: Diamond pulse + 4 sparkles on pure black (#000000)
  // 2000 - 3500ms: Curved split reveal
  // 3500 - 4500ms: Diagonal purple wipe (2px, 12deg) + header reveal
  // 4500ms+: Completed, unmount safely
  useEffect(() => {
    const timerReveal = setTimeout(() => {
      setStage('reveal');
    }, 2000);

    const timerWipe = setTimeout(() => {
      setStage('wipe');
    }, 3500);

    const timerEnd = setTimeout(() => {
      setStage('done');
      onComplete();
    }, 4500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timerReveal);
      clearTimeout(timerWipe);
      clearTimeout(timerEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  // Sparkle coordinates for the exactly 4 subtle sparkle dots around diamond
  const sparkles = [
    { top: '-28px', left: '50%', transform: 'translateX(-50%)', delay: 0.1 },
    { bottom: '-28px', left: '50%', transform: 'translateX(-50%)', delay: 0.4 },
    { left: '-28px', top: '50%', transform: 'translateY(-50%)', delay: 0.25 },
    { right: '-28px', top: '50%', transform: 'translateY(-50%)', delay: 0.55 },
  ];

  return (
    <AnimatePresence>
      {stage !== 'done' && (
        <motion.div
          key="cinematic-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden"
          style={{ backgroundColor: stage === 'wipe' ? 'transparent' : '#000000' }}
        >
          {/* Skip button top-right */}
          <div className="absolute top-6 right-6 z-50">
            <button
              onClick={onComplete}
              className="px-3.5 py-1.5 rounded-full bg-[#0A0A0A]/90 hover:bg-[#121212] border border-[#1A1A1A] text-neutral-400 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 shadow-lg cursor-pointer hover:border-neutral-700"
              title="Skip animation (Esc)"
            >
              <span>Skip to Dashboard</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-neutral-900 border border-neutral-800 rounded text-neutral-400">Esc</kbd>
            </button>
          </div>

          {/* FRAME 0 - 2000ms: PURE BLACK + CENTER DIAMOND + 4 SPARKLE DOTS */}
          {stage === 'diamond' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#000000]"
            >
              <div className="relative flex items-center justify-center">
                {/* 4 subtle sparkle dots softly pulsing */}
                {sparkles.map((sp, idx) => (
                  <motion.div
                    key={`sparkle-${idx}`}
                    style={{
                      position: 'absolute',
                      top: sp.top,
                      bottom: sp.bottom,
                      left: sp.left,
                      right: sp.right,
                      transform: sp.transform,
                    }}
                    animate={{
                      opacity: [0.2, 0.9, 0.2],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: sp.delay,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#8B5CF6]"
                  />
                ))}

                {/* Center diamond: 45deg rotation, white center, purple glow, scale 1 -> 1.2 -> 1 */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-8 h-8 rotate-45 rounded-sm bg-white shadow-[0_0_50px_#8B5CF6,0_0_20px_#8B5CF6] flex items-center justify-center relative"
                >
                  <div className="w-3 h-3 bg-neutral-100 rounded-xs" />
                </motion.div>
              </div>

              {/* Minimal Brand Label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-12 text-center"
              >
                <div className="text-sm font-semibold tracking-wider text-white uppercase font-mono">
                  BugScout
                </div>
                <div className="text-xs text-neutral-500 font-mono mt-1">
                  Deterministic QA Engine
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* FRAME 2000 - 3500ms: CURVED SPLIT REVEAL */}
          {stage === 'reveal' && (
            <motion.div
              initial={{ clipPath: 'ellipse(0% 0% at 50% 50%)' }}
              animate={{ clipPath: 'ellipse(160% 160% at 50% 50%)' }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-transparent pointer-events-none"
            >
              {/* Dark overlay splitting outward to reveal main UI */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                className="absolute inset-0 bg-[#000000]"
              />
            </motion.div>
          )}

          {/* FRAME 3500 - 4500ms: DIAGONAL WIPE (2px purple line, 12deg, left -100% to 200%) */}
          {stage === 'wipe' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                initial={{ x: '-120%', opacity: 0 }}
                animate={{ x: '220%', opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-[-50%] bottom-[-50%] w-[2px] bg-[#8B5CF6] shadow-[0_0_20px_#8B5CF6,0_0_40px_rgba(139,92,246,0.8)]"
                style={{
                  transformOrigin: 'center center',
                  rotate: '12deg',
                }}
              />

              {/* BugScout header slide-fade-in preview */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#0A0A0A]/90 border border-[#1A1A1A] shadow-2xl backdrop-blur-md"
              >
                <div className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]" />
                <span className="text-xs font-mono font-medium text-neutral-300">
                  BugScout Ready • 16 Deterministic Checks
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B5CF6]" />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
