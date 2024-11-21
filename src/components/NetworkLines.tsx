import React, { useRef, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Particle {
  position: number;
  speed: number;
  line: [Point, Point];
}

const NetworkLines: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<Point[]>([]);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initPoints = () => {
      points.current = Array.from({ length: 10 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      }));
    };

    const initParticles = () => {
      particles.current = [];
      points.current.forEach((point, i) => {
        points.current.slice(i + 1).forEach(nextPoint => {
          if (Math.random() > 0.5) return;
          particles.current.push({
            position: 0,
            speed: 0.002 + Math.random() * 0.003,
            line: [point, nextPoint]
          });
        });
      });
    };

    const movePoints = () => {
      points.current.forEach(point => {
        point.x += point.vx;
        point.y += point.vy;

        if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
      });
    };

    const moveParticles = () => {
      particles.current.forEach(particle => {
        particle.position += particle.speed;
        if (particle.position > 1) particle.position = 0;
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(229, 231, 235, 0.05)';
      ctx.fillStyle = 'rgba(229, 231, 235, 0.3)';

      // Draw lines
      particles.current.forEach(({ line }) => {
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        ctx.lineTo(line[1].x, line[1].y);
        ctx.stroke();
      });

      // Draw particles
      particles.current.forEach(particle => {
        const { line, position } = particle;
        const x = line[0].x + (line[1].x - line[0].x) * position;
        const y = line[0].y + (line[1].y - line[0].y) * position;
        
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      movePoints();
      moveParticles();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initPoints();
    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 opacity-40"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default NetworkLines;