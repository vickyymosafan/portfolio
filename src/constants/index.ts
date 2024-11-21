import React from 'react';
import { Layout, Palette, Code2, Lightbulb, Rocket } from 'lucide-react';
import { ProjectType, SkillCategoryType, ExperienceType } from '../types';

export const PROJECTS: ProjectType[] = [
  {
    title: 'AI-Powered Chatbot',
    description: 'An intelligent conversational AI assistant built with OpenAI GPT-4, featuring real-time responses, code explanation, and context awareness.',
    image: 'https://images.unsplash.com/photo-1676299081847-c3c9b9d4c4c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    tech: ['React', 'OpenAI API', 'TypeScript', 'TailwindCSS'],
    github: 'https://github.com',
    live: 'https://example.com'
  },
  {
    title: '3D Product Configurator',
    description: 'Interactive 3D product visualization tool allowing users to customize products in real-time with physics-based rendering.',
    image: 'https://images.unsplash.com/photo-1633899306328-c5e70574aaa3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    tech: ['Three.js', 'React Three Fiber', 'WebGL', 'GSAP'],
    github: 'https://github.com',
    live: 'https://example.com'
  },
  {
    title: 'Real-time Collaboration Platform',
    description: 'A Figma-like collaborative workspace with real-time cursors, live editing, and version control.',
    image: 'https://images.unsplash.com/photo-1600267204091-5c1ab8b10c02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    tech: ['WebSocket', 'React', 'Redux', 'MongoDB'],
    github: 'https://github.com',
    live: 'https://example.com'
  },
  {
    title: 'NFT Marketplace',
    description: 'Decentralized marketplace for trading digital assets with MetaMask integration and live auction features.',
    image: 'https://images.unsplash.com/photo-1644658722893-2f1a17a6de74?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    tech: ['Ethereum', 'Solidity', 'Web3.js', 'Next.js'],
    github: 'https://github.com',
    live: 'https://example.com'
  },
  {
    title: 'AI Music Visualizer',
    description: 'Dynamic music visualization using AI to generate real-time abstract art based on audio analysis.',
    image: 'https://images.unsplash.com/photo-1619983081563-430f63602796?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    tech: ['Web Audio API', 'Canvas', 'TensorFlow.js', 'Vue 3'],
    github: 'https://github.com',
    live: 'https://example.com'
  },
  {
    title: 'AR Shopping Experience',
    description: 'Augmented reality shopping app allowing users to visualize products in their space before purchase.',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    tech: ['WebXR', 'Three.js', 'React', 'Shopify API'],
    github: 'https://github.com',
    live: 'https://example.com'
  }
];

export const SKILLS: SkillCategoryType[] = [
  {
    category: 'Frontend',
    icon: React.createElement(Layout, { className: "w-8 h-8" }),
    skills: ['React', 'Next.js', 'TypeScript', 'Vue.js', 'Tailwind CSS', 'Redux', 'GraphQL', 'WebGL'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    category: 'UI/UX',
    icon: React.createElement(Palette, { className: "w-8 h-8" }),
    skills: ['Framer Motion', 'GSAP', 'Three.js', 'CSS Animation'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    category: 'Tools',
    icon: React.createElement(Code2, { className: "w-8 h-8" }),
    skills: ['Git', 'Webpack', 'Vite', 'ESLint'],
    color: 'from-rose-500 to-orange-500'
  },
  {
    category: 'Soft Skills',
    icon: React.createElement(Lightbulb, { className: "w-8 h-8" }),
    skills: ['Team Leadership', 'Problem Solving', 'Communication'],
    color: 'from-orange-500 to-amber-500'
  },
  {
    category: 'DevOps',
    icon: React.createElement(Rocket, { className: "w-8 h-8" }),
    skills: ['Vercel', 'Netlify', 'Docker', 'CI/CD'],
    color: 'from-amber-500 to-purple-500'
  }
];

export const EXPERIENCES: ExperienceType[] = [
  {
    title: 'Head of MediaTech Department',
    company: 'HIMAFORSI - Universitas Muhammadiyah Jember',
    period: '2022 - 2024',
    description: 'Led digital media strategy and content creation, driving organizational growth through innovative tech solutions and creative team management.',
  },
  {
    title: 'Technical Designer',
    company: 'SCaNIT - SMA Negeri 1 Situbondo',
    period: '2019 - 2020',
    description: 'Developed technical designs and creative solutions while fostering collaboration in the school\'s IT organization, building a strong foundation in design and technology.',
  }
];