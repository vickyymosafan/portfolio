import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '../layout/AnimatedSection';
import ExperienceCard from '../ui/ExperienceCard';
import { EXPERIENCES } from '../../constants';

const Experience = () => {
  return (
    <AnimatedSection className="py-20 w-full">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Experience</h2>
          <div className="relative">
            <div className="absolute left-0 md:left-1/2 transform -translate-x-px h-full w-0.5 bg-gradient-to-b from-violet-500 to-fuchsia-500" />
            <div className="space-y-12">
              {EXPERIENCES.map((exp, index) => (
                <ExperienceCard key={index} experience={exp} index={index} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

export default Experience;