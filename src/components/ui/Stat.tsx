import React from 'react';
import { motion } from 'framer-motion';
import { StatProps } from '../../types';

const Stat: React.FC<StatProps> = ({ icon, value, label }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex flex-col items-center p-4 bg-[#1E1A2C] rounded-lg border border-violet-500/10"
  >
    <div className="text-violet-500 mb-2">{icon}</div>
    <div className="text-2xl font-bold mb-1 text-white">{value}</div>
    <div className="text-sm text-gray-300">{label}</div>
  </motion.div>
);

export default Stat;