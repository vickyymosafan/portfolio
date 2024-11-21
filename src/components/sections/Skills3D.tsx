import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '../layout/AnimatedSection';
import SkillCard from '../ui/SkillCard';
import { SKILLS } from '../../constants';

const Skills3D = () => {
  return (
    <AnimatedSection className="py-20 w-full">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Skills & Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SKILLS.map((category, index) => (
              <SkillCard key={category.category} category={category} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

export default Skills3D;