import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { AnimatedSectionProps } from '../../types';

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className = '' }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.05, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], ["10deg", "5deg", "0deg"]);

  return (
    <motion.section
      ref={ref}
      style={{
        scale,
        opacity,
        rotateX,
      }}
      className={`transform-gpu perspective-1000 ${className}`}
    >
      {children}
    </motion.section>
  );
};

export default AnimatedSection;