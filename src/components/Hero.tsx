import React from 'react';
import { motion } from 'framer-motion';
import DynamicBackground from './SpinningCube';
import NetworkLines from './NetworkLines';
import { ProfileImage } from './ui/ProfileImage';
import { SocialLinks } from './ui/SocialLinks';
import { ScrollIndicator } from './ui/ScrollIndicator';

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center animated-bg overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-gray-500/5 via-transparent to-transparent opacity-20" />
        <DynamicBackground />
        <NetworkLines />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/50 via-dark-base/70 to-dark-base/90 z-10" />
      
      <div className="container mx-auto px-4 z-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between"
        >
          <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
            <motion.h1 
              className="text-6xl md:text-7xl font-bold mb-4 tracking-tight"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-gradient">
                Vicky Mosafan
              </span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-soft border-soft">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-gray-400/50 animate-pulse" />
                  <span className="text-xl font-semibold text-gradient">
                    Open to Work
                  </span>
                </div>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-xl md:text-2xl text-soft leading-relaxed font-light mb-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              A passionate computer science student combining creative design sensibilities with technical expertise in React, HTML, CSS, and JavaScript to craft engaging web experiences, actively seeking opportunities to contribute to meaningful projects.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <SocialLinks />
            </motion.div>
          </div>

          <div className="md:w-1/2 flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-radial from-gray-500/5 via-transparent to-transparent opacity-30 blur-2xl" />
            <ProfileImage />
          </div>
        </motion.div>
      </div>

      <ScrollIndicator />
    </div>
  );
};

export default Hero;