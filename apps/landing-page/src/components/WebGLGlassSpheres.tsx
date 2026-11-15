"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useReducedMotion } from "motion/react";

interface SphereObject {
  mesh: THREE.Mesh;
  initialX: number;
  initialY: number;
  initialZ: number;
  speed: number;
  phase: number;
  radius: number;
  rotationSpeed: { x: number; y: number; z: number };
}

export function WebGLGlassSpheres({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 14;

    // Ambient and vibrant accent lights (Mint and Teal)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 8, 10);
    scene.add(dirLight1);

    const mintLight = new THREE.PointLight(0x5cc2a8, 3.5, 25);
    mintLight.position.set(-6, -4, 4);
    scene.add(mintLight);

    const tealLight = new THREE.PointLight(0x12695c, 2.5, 30);
    tealLight.position.set(8, 4, 2);
    scene.add(tealLight);

    // High quality glass material with transmission and refraction
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.92,
      thickness: 1.8,
      ior: 1.52,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      attenuationColor: new THREE.Color(0x99e6d4),
      attenuationDistance: 2.5,
      transparent: true,
      opacity: 0.92,
    });

    // Secondary iridescent mint glass for contrast
    const mintGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xd2f6ed),
      metalness: 0.1,
      roughness: 0.12,
      transmission: 0.88,
      thickness: 2.2,
      ior: 1.48,
      specularIntensity: 1.2,
      clearcoat: 0.8,
      attenuationColor: new THREE.Color(0x5cc2a8),
      attenuationDistance: 1.5,
      transparent: true,
      opacity: 0.88,
    });

    const sphereData = [
      { size: 1.85, x: -5.4, y: 1.6, z: -1, mat: glassMaterial, speed: 0.7, phase: 0 },
      { size: 1.2, x: 5.6, y: 2.8, z: 0.5, mat: mintGlassMaterial, speed: 0.9, phase: 1.5 },
      { size: 2.4, x: 6.8, y: -2.2, z: -2, mat: glassMaterial, speed: 0.6, phase: 3.2 },
      { size: 0.9, x: -6.2, y: -2.8, z: 1, mat: mintGlassMaterial, speed: 1.1, phase: 4.8 },
      { size: 0.7, x: 1.2, y: 4.2, z: -1.5, mat: glassMaterial, speed: 1.2, phase: 2.1 },
    ];

    const spheres: SphereObject[] = sphereData.map((d) => {
      const geometry = new THREE.SphereGeometry(d.size, 48, 48);
      const mesh = new THREE.Mesh(geometry, d.mat);
      mesh.position.set(d.x, d.y, d.z);
      scene.add(mesh);
      return {
        mesh,
        initialX: d.x,
        initialY: d.y,
        initialZ: d.z,
        speed: d.speed,
        phase: d.phase,
        radius: d.size,
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.005,
          y: (Math.random() - 0.5) * 0.005,
          z: (Math.random() - 0.5) * 0.005,
        },
      };
    });

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerping
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Update camera parallax
      camera.position.x = currentMouseX * 0.8;
      camera.position.y = currentMouseY * 0.6;
      camera.lookAt(0, 0, 0);

      // Animate floating spheres
      spheres.forEach((s) => {
        const t = elapsedTime * s.speed + s.phase;
        s.mesh.position.y = s.initialY + Math.sin(t) * 0.45;
        s.mesh.position.x = s.initialX + Math.cos(t * 0.8) * 0.25 - currentMouseX * 0.3;
        s.mesh.rotation.x += s.rotationSpeed.x;
        s.mesh.rotation.y += s.rotationSpeed.y;
      });

      // Animate point light color pulsation
      mintLight.position.x = -6 + Math.sin(elapsedTime * 0.8) * 1.5;
      tealLight.position.y = 4 + Math.cos(elapsedTime * 0.7) * 1.5;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      spheres.forEach((s) => {
        s.mesh.geometry.dispose();
      });
      glassMaterial.dispose();
      mintGlassMaterial.dispose();
    };
  }, [reduceMotion]);

  if (!webglSupported || reduceMotion) {
    return (
      <div className={`pointer-events-none overflow-hidden ${className}`}>
        <div className="absolute -left-10 top-16 size-44 glass-sphere animate-float opacity-70" />
        <div className="absolute right-12 top-24 size-32 glass-sphere animate-float opacity-80" style={{ animationDelay: "2s" }} />
        <div className="absolute right-24 bottom-20 size-56 glass-sphere animate-float opacity-65" style={{ animationDelay: "4s" }} />
        <div className="absolute left-1/4 bottom-12 size-24 glass-sphere animate-float opacity-50" style={{ animationDelay: "1s" }} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
