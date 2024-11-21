import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const ScrollIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20"
    >
      <motion.div
        animate={{ 
          y: [0, 10, 0],
          filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex flex-col items-center"
      >
        <span className="text-emerald-200/80 text-sm mb-2 font-light tracking-wider">
          Scroll to explore
        </span>
        <div className="p-2 rounded-full bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors duration-300">
          <ChevronDown className="w-6 h-6 text-emerald-200/80" />
        </div>
      </motion.div>
    </motion.div>
  );
};