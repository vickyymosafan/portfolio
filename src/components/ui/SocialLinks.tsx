import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';

const socialLinks = [
  { href: "https://github.com/vickyymosafan", icon: <Github />, label: "GitHub" },
  { href: "https://www.linkedin.com/in/vickymosafan/", icon: <Linkedin />, label: "LinkedIn" },
  { href: "mailto:mvickymosafan@gmail.com", icon: <Mail />, label: "Email" }
];

export const SocialLinks = () => {
  return (
    <motion.div 
      className="flex justify-center md:justify-start space-x-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      {socialLinks.map(({ href, icon, label }) => (
        <SocialLink key={label} href={href} icon={icon} label={label} />
      ))}
    </motion.div>
  );
};

const SocialLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
  <motion.a
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group relative p-3 rounded-full glass-card hover:bg-white/15 text-white/90 hover:text-white transition-all duration-300"
    aria-label={label}
  >
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
    {icon}
  </motion.a>
);