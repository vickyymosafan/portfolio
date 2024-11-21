import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Vector3, Color } from 'three';
import { Stars, Float, MeshDistortMaterial, GradientTexture, Sphere } from '@react-three/drei';

const NeuralNetwork = () => {
  const points = useMemo(() => {
    const temp = [];
    // Reduce number of points for better performance
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * 25;
      const y = (Math.random() - 0.5) * 25;
      const z = (Math.random() - 0.5) * 25;
      temp.push(new Vector3(x, y, z));
    }
    return temp;
  }, []);

  const particlesRef = useRef<any[]>([]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 0.5; // Slower animation
    particlesRef.current.forEach((particle, i) => {
      if (!particle) return;
      const x = Math.sin(time + i) * 0.1;
      const y = Math.cos(time + i) * 0.1;
      particle.position.x += x * 0.01;
      particle.position.y += y * 0.01;
    });
  });

  return (
    <group>
      {points.map((point, i) => (
        <mesh
          key={i}
          ref={el => particlesRef.current[i] = el}
          position={[point.x, point.y, point.z]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color={new Color().setHSL(i / points.length, 0.8, 0.5)}
            emissive={new Color().setHSL(i / points.length, 0.8, 0.5)}
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
};

const EnergyField = () => {
  const count = 1000; // Reduced particle count
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.random() * 15 + 5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const pointsRef = useRef<any>();

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime() * 0.03; // Slower rotation
    pointsRef.current.rotation.y = time;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        blending={2}
        color="#8B5CF6"
        transparent
        opacity={0.6}
      />
    </points>
  );
};

const FloatingOrbs = () => {
  const orbsRef = useRef<any[]>([]);
  const orbsData = useMemo(() => 
    Array.from({ length: 3 }, (_, i) => ({
      position: new Vector3(
        Math.sin(i / 3 * Math.PI * 2) * 8,
        Math.cos(i / 3 * Math.PI * 2) * 8,
        0
      ),
      scale: Math.random() * 0.5 + 0.5,
      speed: Math.random() * 0.1 + 0.05
    })), []
  );

  useFrame(({ clock }) => {
    orbsRef.current.forEach((orb, i) => {
      if (!orb) return;
      const time = clock.getElapsedTime();
      const data = orbsData[i];
      orb.position.x = Math.sin(time * data.speed + i) * 8;
      orb.position.y = Math.cos(time * data.speed + i) * 8;
    });
  });

  return (
    <>
      {orbsData.map((data, i) => (
        <Float key={i} speed={1} rotationIntensity={1} floatIntensity={1}>
          <mesh
            ref={el => orbsRef.current[i] = el}
            position={data.position}
            scale={data.scale}
          >
            <sphereGeometry args={[1, 16, 16]} />
            <MeshDistortMaterial
              color={new Color().setHSL(i / 3, 0.8, 0.5)}
              distort={0.3}
              speed={1}
              transparent
              opacity={0.7}
            >
              <GradientTexture
                stops={[0, 1]}
                colors={['#8B5CF6', '#3B82F6']}
              />
            </MeshDistortMaterial>
          </mesh>
        </Float>
      ))}
    </>
  );
};

const DynamicBackground = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 75 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
      dpr={[1, 1.5]} // Limit DPR for better performance
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <Stars
        radius={50}
        depth={50}
        count={500}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      <NeuralNetwork />
      <EnergyField />
      <FloatingOrbs />

      <fog attach="fog" args={['#13111C', 20, 30]} />
    </Canvas>
  );
};

export default DynamicBackground;