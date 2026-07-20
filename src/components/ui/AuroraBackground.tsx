'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function StarField() {
  const ref = useRef<THREE.Points>(null!);
  const startTime = useRef(performance.now());

  const geometry = useMemo(() => {
    const count = 800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (ref.current) {
      const t = (performance.now() - startTime.current) / 1000;
      ref.current.rotation.y = t * 0.015;
      ref.current.rotation.x = Math.sin(t * 0.01) * 0.05;
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const startTime = useRef(performance.now());
  const count = 50;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(() => {
    const pos: number[][] = [];
    for (let i = 0; i < count; i++) {
      pos.push([
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 20 - 5,
      ]);
    }
    return pos;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const t = (performance.now() - startTime.current) / 1000 * 0.15;
    positions.forEach((pos, i) => {
      dummy.position.set(
        pos[0] + Math.sin(t + i) * 0.5,
        pos[1] + Math.cos(t + i * 0.7) * 0.5,
        pos[2]
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color="#7C3AED" transparent opacity={0.25} />
    </instancedMesh>
  );
}

function GlowSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const startTime = useRef(performance.now());

  useFrame(() => {
    if (meshRef.current) {
      const t = (performance.now() - startTime.current) / 1000;
      meshRef.current.position.y = Math.sin(t * 0.2) * 0.8;
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 0.3) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -8]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshBasicMaterial color="#7C3AED" transparent opacity={0.08} depthWrite={false} />
    </mesh>
  );
}

export default function AuroraBackground() {
  useEffect(() => {
    const warn = console.warn;
    console.warn = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('THREE.Clock:')) return;
      warn(...args);
    };
    return () => { console.warn = warn; };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#050505' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }}
        style={{ background: '#050505' }}
      >
        <StarField />
        <GlowSphere />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}
