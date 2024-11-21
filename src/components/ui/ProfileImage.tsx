import React from 'react';
import { motion } from 'framer-motion';

export const ProfileImage = () => {
  return (
    <motion.div 
      className="md:w-1/2 flex justify-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="relative group">
        {/* Dark Neon Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-purple-500/20 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Profile Container */}
        <motion.div 
          className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden"
          animate={{ 
            rotateZ: [0, 2, 0, -2, 0],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Dark Neon Border */}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 glow-border-dark" />
          
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-emerald-500/30 to-purple-500/30 rounded-full blur-3xl opacity-20 animate-pulse-slow" />
          
          {/* Profile Image */}
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-gray-900/50 shadow-2xl">
            <img
              src="/vicky.jpeg"
              alt="Vicky Mosafan"
              className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};