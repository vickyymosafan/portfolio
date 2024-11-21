// Component Props Types
export interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
}

export interface ProjectType {
  title: string;
  description: string;
  image: string;
  tech: string[];
  github: string;
  live: string;
}

export interface SkillCategoryType {
  category: string;
  icon: React.ReactNode;
  skills: string[];
  color: string;
}

export interface ExperienceType {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface StatProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}