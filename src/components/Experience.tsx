import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar } from 'lucide-react';
import { EXPERIENCES } from '../constants';
import AnimatedSection from './AnimatedSection';

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
            {/* Timeline Line with Gradient */}
            <div className="absolute left-0 md:left-1/2 transform -translate-x-px h-full w-1">
              <div className="h-full w-full bg-gradient-to-b from-cyan-500 via-purple-500 to-emerald-500 opacity-50 blur-sm" />
              <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-cyan-500 via-purple-500 to-emerald-500" />
            </div>
            
            <div className="space-y-12">
              {EXPERIENCES.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative flex items-center justify-between md:justify-normal md:even:flex-row-reverse group"
                >
                  <div className="w-full md:w-5/12">
                    {/* Experience Card with Neon Effect */}
                    <div className="relative">
                      {/* Neon Glow */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                      
                      {/* Card Content */}
                      <div className="relative p-6 bg-[#1E1A2C]/90 backdrop-blur-xl rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">{exp.title}</h3>
                          <div className="flex items-center text-sm text-cyan-300/80">
                            <Calendar className="w-4 h-4 mr-1" />
                            {exp.period}
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center text-purple-400">
                            <Briefcase className="w-4 h-4 mr-2" />
                            <span className="font-medium">{exp.company}</span>
                          </div>
                        </div>
                        <p className="text-gray-300/90">{exp.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Node */}
                  <motion.div
                    className="absolute left-0 md:left-1/2 transform -translate-x-1/2"
                    whileHover={{ scale: 1.2 }}
                  >
                    <div className="relative w-8 h-8">
                      {/* Neon Glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 blur-sm" />
                      {/* Node */}
                      <div className="relative w-full h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

export default Experience;