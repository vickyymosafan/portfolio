import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Rocket, Coffee } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const About = () => {
  return (
    <AnimatedSection className="py-20 w-full">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-16 text-white">About Me</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-gray-300">
              Hi, I'm Vicky Mosafan, a college student with a strong foundation in HTML, CSS, and JavaScript. I’m passionate about building interactive and responsive designs that enhance user experience. Currently expanding my skills in modern frameworks like React and Vue.js, I’m eager to apply my creativity and technical knowledge to real-world projects.
              </p>
              <p className="text-lg text-gray-300">
              I'm actively seeking internship or junior developer roles where I can grow and make an impact. Let’s connect and collaborate!
              </p>
              <div className="grid grid-cols-3 gap-4 mt-8">
                <Stat icon={<Code2 className="w-6 h-6" />} value="5+" label="Projects" />
                <Stat icon={<Coffee className="w-6 h-6" />} value="50+" label="Study Hours" />
                <Stat icon={<Rocket className="w-6 h-6" />} value="5+" label="Completed Courses" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1552308995-2baac1ad5490?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1509718443690-d8e2fb3474b7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
              ].map((src, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative group"
                >
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={src}
                      alt={`About ${index + 1}`}
                      className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex flex-col items-center p-4 bg-[#1E1A2C] rounded-lg border border-violet-500/10"
  >
    <div className="text-violet-500 mb-2">{icon}</div>
    <div className="text-2xl font-bold mb-1 text-white">{value}</div>
    <div className="text-sm text-gray-300">{label}</div>
  </motion.div>
);

export default About;