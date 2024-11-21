import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Briefcase } from 'lucide-react';
import { ExperienceType } from '../../types';

interface ExperienceCardProps {
  experience: ExperienceType;
  index: number;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className="relative flex items-center justify-between md:justify-normal md:even:flex-row-reverse"
    >
      <div className="w-full md:w-5/12">
        <div className="bg-[#1E1A2C] p-6 rounded-xl border border-violet-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{experience.title}</h3>
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              {experience.period}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center text-violet-400">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="font-medium">{experience.company}</span>
            </div>
          </div>
          <p className="text-gray-300">{experience.description}</p>
        </div>
      </div>
      <div className="absolute left-0 md:left-1/2 transform -translate-x-1/2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default ExperienceCard;