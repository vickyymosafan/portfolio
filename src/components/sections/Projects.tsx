import React from 'react';
import AnimatedSection from '../layout/AnimatedSection';
import ProjectCard from '../ui/ProjectCard';
import { PROJECTS } from '../../constants';

const Projects = () => {
  return (
    <AnimatedSection className="py-20 w-full">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECTS.map((project, index) => (
            <ProjectCard key={index} project={project} index={index} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Projects;