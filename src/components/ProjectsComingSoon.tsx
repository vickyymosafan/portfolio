import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Code2, Rocket, Timer } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const FloatingOrb = () => {
  const meshRef = useRef<any>();

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]}>
      <MeshDistortMaterial
        color="#8B5CF6"
        attach="material"
        distort={0.2}
        speed={1}
        roughness={0.4}
        metalness={0.8}
      />
    </Sphere>
  );
};

const ProjectsComingSoon = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Memoize floating elements
  const floatingElements = useMemo(() => (
    [...Array(10)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: i * 0.1,
    }))
  ), []);

  return (
    <AnimatedSection className="py-20 w-full min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-violet-500/10 via-transparent to-transparent opacity-30" />
      
      <div ref={containerRef} className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="absolute inset-0 -z-10">
            <Canvas
              camera={{ position: [0, 0, 5] }}
              dpr={[1, 1.5]}
            >
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <FloatingOrb />
            </Canvas>
          </div>

          <div className="text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-violet-200 via-white to-violet-200 bg-clip-text text-transparent">
                Featured Projects
              </h2>
              <p className="text-xl text-gray-300/90 max-w-2xl mx-auto">
                Exciting new frontend projects are currently under development
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-300" />
              
              <div className="relative bg-[#1E1A2C]/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Feature
                    icon={<Code2 className="w-6 h-6" />}
                    title="Modern Stack"
                    description="Built with the latest frontend technologies"
                  />
                  <Feature
                    icon={<Timer className="w-6 h-6" />}
                    title="Coming Soon"
                    description="Projects are being carefully crafted"
                  />
                  <Feature
                    icon={<Rocket className="w-6 h-6" />}
                    title="Innovation"
                    description="Pushing boundaries with new solutions"
                  />
                </div>

                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "65%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="h-2 bg-gradient-to-r from-violet-500 via-cyan-500 to-purple-500 rounded-full mb-4"
                />
                
                <p className="text-gray-300/90 text-lg">
                  Development Progress: 65%
                </p>
              </div>
            </motion.div>

            <motion.div
              style={{ y, opacity }}
              className="absolute inset-0 pointer-events-none"
            >
              {floatingElements.map((el, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.3, scale: 1 }}
                  transition={{
                    delay: el.delay,
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="absolute w-2 h-2 bg-violet-500 rounded-full"
                  style={{
                    left: el.left,
                    top: el.top,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

const Feature = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="p-3 rounded-full bg-violet-500/20 text-violet-300 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-300/90">{description}</p>
  </div>
);

export default ProjectsComingSoon;