import Hero from './components/Hero';
import About from './components/About';
import Skills3D from './components/Skills3D';
import Experience from './components/Experience';
import ProjectsComingSoon from './components/ProjectsComingSoon';
import Contact from './components/Contact';

function App() {
  return (
    <div className="w-full animated-bg">
      <Hero />
      <About />
      <Skills3D />
      <Experience />
      <ProjectsComingSoon />
      <Contact />
    </div>
  );
}

export default App;