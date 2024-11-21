import React from 'react';
import { motion } from 'framer-motion';
import { SkillCategoryType } from '../../types';

interface SkillCardProps {
  category: SkillCategoryType;
  index: number;
}

const SkillCard: React.FC<SkillCardProps> = ({ category, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="skill-card p-6"
    >
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
          {category.icon}
        </div>
        <h3 className="text-xl font-bold ml-4 text-white">{category.category}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {category.skills.map((skill, skillIndex) => (
          <motion.div
            key={skill}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: skillIndex * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-300 text-sm font-medium"
          >
            {skill}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SkillCard;