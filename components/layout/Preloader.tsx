"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreloaderStore } from '@/lib/stores/preloaderStore';
import Image from 'next/image';

export default function Preloader() {
  const { isLoading, setLoading } = usePreloaderStore();

  useEffect(() => {
    // Minimum 1.5 seconds display
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [setLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0f0a]"
        >
          <div className="relative flex items-center justify-center">
            {/* Ripple rings */}
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0.8, scale: 0.8 }}
                animate={{ opacity: 0, scale: 2.5 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.6,
                  ease: "easeOut",
                }}
                className="absolute w-24 h-24 rounded-full border-2 border-emerald-500"
              />
            ))}
            
            {/* Logo image */}
            <div className="z-10 bg-[#0a0f0a] rounded-full p-4 relative flex items-center justify-center w-24 h-24">
              <Image 
                src="/next.svg" 
                alt="Swadhin Enterprise Logo" 
                width={80} 
                height={80} 
                className="invert" 
              />
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center z-10">
            <h1 className="text-3xl font-bold text-white font-heading">
              Swadhin Enterprise
            </h1>
            <p className="text-emerald-400 mt-2 text-lg font-sans">
              নন-ওভেন ব্যাগ প্রিন্ট
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
