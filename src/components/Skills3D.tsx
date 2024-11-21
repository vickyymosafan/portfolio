import React, { useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FixedSizeGrid as Grid } from 'react-window';
import { Icon } from '@iconify/react';
import { ChevronDown } from 'lucide-react';
import { SKILLS } from "../constants";
import AnimatedSection from "./AnimatedSection";

const Skills3D = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const getGridDimensions = () => {
    const padding = 32;
    const availableWidth = window.innerWidth - (padding * 2);
    
    if (window.innerWidth >= 1280) {
      return { columns: 3, width: Math.min(1200, availableWidth) };
    } else if (window.innerWidth >= 768) {
      return { columns: 2, width: Math.min(1024, availableWidth) };
    }
    return { columns: 1, width: Math.min(640, availableWidth) };
  };

  const [dimensions, setDimensions] = React.useState(getGridDimensions());

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions(getGridDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * dimensions.columns + columnIndex;
    if (index >= SKILLS.length) return null;

    const category = SKILLS[index];
    const cellStyle = {
      ...style,
      left: parseInt(style.left) + 16,
      top: parseInt(style.top) + 16,
      width: parseInt(style.width) - 32,
      height: parseInt(style.height) - 32,
    };

    return (
      <div style={cellStyle}>
        <SkillCard category={category} index={index} inView={inView} />
      </div>
    );
  }, [dimensions.columns, inView]);

  const rowCount = Math.ceil(SKILLS.length / dimensions.columns);
  const columnWidth = dimensions.width / dimensions.columns;
  const rowHeight = 340;

  return (
    <AnimatedSection className="py-20 w-full overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-white">
            Skills & Expertise
          </h2>

          {/* Dark Neon Background Wrapper */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-cyan-500/5 to-emerald-500/5 rounded-3xl blur-xl" />
            <div className="absolute inset-0 bg-[#1E1A2C]/40 backdrop-blur-sm rounded-3xl" />
            
            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
            >
              <span className="text-gray-400 text-sm mb-2">Scroll to explore more</span>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.div>

            <div className="relative flex justify-center p-6">
              <div className="perspective-1000" style={{ width: dimensions.width }}>
                <Grid
                  columnCount={dimensions.columns}
                  columnWidth={columnWidth}
                  height={Math.min(window.innerHeight * 0.8, rowCount * rowHeight)}
                  rowCount={rowCount}
                  rowHeight={rowHeight}
                  width={dimensions.width}
                  className="scrollbar-hide"
                >
                  {Cell}
                </Grid>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

const SkillCard = ({ category, index, inView }) => {
  const controls = useAnimation();

  React.useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        y: 0,
        rotateX: 0,
        transition: { delay: index * 0.2, duration: 0.5 },
      });
    }
  }, [inView, controls, index]);

  const getSkillIcon = (skill: string) => {
    const iconMap: { [key: string]: string } = {
      'React': 'logos:react',
      'Next.js': 'logos:nextjs-icon',
      'TypeScript': 'logos:typescript-icon',
      'Vue.js': 'logos:vue',
      'Tailwind CSS': 'logos:tailwindcss-icon',
      'Redux': 'logos:redux',
      'GraphQL': 'logos:graphql',
      'WebGL': 'logos:webgl',
      'Framer Motion': 'logos:framer',
      'GSAP': 'logos:gsap',
      'Three.js': 'logos:threejs',
      'CSS Animation': 'logos:css-3',
      'Git': 'logos:git-icon',
      'Webpack': 'logos:webpack',
      'Vite': 'logos:vitejs',
      'ESLint': 'logos:eslint',
      'Docker': 'logos:docker-icon',
      'CI/CD': 'logos:jenkins',
      'Vercel': 'logos:vercel-icon',
      'Netlify': 'logos:netlify',
    };

    return iconMap[skill] || 'carbon:skill-level';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 20 }}
      animate={controls}
      whileHover={{
        rotateY: 5,
        z: 50,
      }}
      className="relative group skill-card h-full"
    >
      {/* Neon Glow Background */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />

      {/* Card Content */}
      <div className="relative p-6 bg-[#1E1A2C]/90 backdrop-blur-xl rounded-2xl transform-gpu transition-all duration-300 border border-white/10 h-full skill-content">
        <motion.div
          className="flex items-center mb-6"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.3 }}
        >
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${category.color} text-white transform transition-transform duration-300 skill-icon`}
          >
            {category.icon}
          </div>
          <h3 className="text-xl lg:text-2xl font-bold ml-4 text-white">
            {category.category}
          </h3>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 skill-grid">
          {category.skills.map((skill, skillIndex) => (
            <motion.div
              key={skill}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + skillIndex * 0.1 }}
              whileHover={{
                scale: 1.05,
                rotateZ: [-1, 1],
                transition: { duration: 0.2 },
              }}
              className="px-3 py-2 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5 text-gray-300 text-sm font-medium transform-gpu hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300 flex items-center justify-center text-center skill-hover-effect gap-2"
            >
              <Icon icon={getSkillIcon(skill)} className="w-4 h-4" />
              {skill}
            </motion.div>
          ))}
        </div>

        {/* 3D Floating Elements */}
        <div className="absolute -z-10 inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <motion.div
            className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Skills3D;