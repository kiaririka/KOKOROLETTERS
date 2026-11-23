/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";

export type AnimationMode = "sakura" | "spirits" | "off";

interface MapThreeCanvasProps {
  activeRegionCoords: { x: number; y: number } | null;
  animationMode: AnimationMode;
  hoveredRegionId: string | null;
}

/**
 * Loads Three.js dynamically if not already loaded globally via CDN or bundle.
 */
function getThree(): Promise<any> {
  if (typeof window !== "undefined" && (window as any).THREE) {
    return Promise.resolve((window as any).THREE);
  }
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve(null);
    const existing = document.querySelector('script[src*="three.min.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).THREE));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    script.onload = () => resolve((window as any).THREE);
    script.onerror = () => reject(new Error("Failed to load Three.js"));
    document.head.appendChild(script);
  });
}

export default function MapThreeCanvas({
  activeRegionCoords,
  animationMode,
  hoveredRegionId,
}: MapThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  // Track mouse coordinates for interactive wind turbulence
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouseRef.current = { x: nx, y: ny, active: true };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  useEffect(() => {
    let isMounted = true;
    getThree()
      .then((THREE) => {
        if (isMounted && THREE) setThreeLoaded(true);
      })
      .catch((err) => {
        console.warn("Three.js not loaded, falling back to 2D canvas effects", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (animationMode === "off") return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const THREE = (window as any).THREE;
    if (!THREE) {
      // 2D Canvas Fallback if WebGL/Three.js is still fetching or disabled
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      let animId: number;
      const width = (canvas.width = container.clientWidth);
      const height = (canvas.height = container.clientHeight);

      const petals = Array.from({ length: 28 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 5 + 3,
        speedX: Math.random() * 0.8 + 0.3,
        speedY: Math.random() * 1.2 + 0.6,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        opacity: Math.random() * 0.4 + 0.4,
      }));

      const render2D = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = animationMode === "spirits" ? "#fef08a" : "#fbcfe8";
        petals.forEach((p) => {
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          p.x += p.speedX;
          p.y += p.speedY;
          p.rot += p.rotSpeed;
          if (p.x > width + 10) p.x = -10;
          if (p.y > height + 10) p.y = -10;
        });
        animId = requestAnimationFrame(render2D);
      };
      render2D();
      return () => cancelAnimationFrame(animId);
    }

    // --- FULL THREE.JS 3D SCENE ---
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 320;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle Group
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    // 1. Create Sakura Petals
    const isSakura = animationMode === "sakura";
    const particleCount = isSakura ? 45 : 36;
    const particles: Array<{
      mesh: any;
      vx: number;
      vy: number;
      vz: number;
      rx: number;
      ry: number;
      rz: number;
      initialY: number;
      phase: number;
    }> = [];

    // Petal geometry: natural curved petal shape
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(3, 2, 4, 7, 0, 10);
    petalShape.bezierCurveTo(-4, 7, -3, 2, 0, 0);
    const petalGeom = new THREE.ShapeGeometry(petalShape);

    // Spirit geometry: glowing soft sphere
    const spiritGeom = new THREE.SphereGeometry(2.5, 8, 8);

    const sakuraColors = [0xffd1dc, 0xffc0cb, 0xffe4e8, 0xffb7c5];
    const spiritColors = [0xfef08a, 0xa7f3d0, 0x6ee7b7, 0xfde047];

    for (let i = 0; i < particleCount; i++) {
      const colors = isSakura ? sakuraColors : spiritColors;
      const color = colors[i % colors.length];

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: isSakura ? 0.75 : 0.85,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(isSakura ? petalGeom : spiritGeom, material);
      const boundsX = 140;
      const boundsY = 140;

      mesh.position.set(
        (Math.random() - 0.5) * boundsX * 2,
        (Math.random() - 0.5) * boundsY * 2,
        (Math.random() - 0.5) * 60
      );

      const scale = isSakura ? Math.random() * 0.7 + 0.6 : Math.random() * 0.8 + 0.5;
      mesh.scale.set(scale, scale, scale);

      particleGroup.add(mesh);
      particles.push({
        mesh,
        vx: isSakura ? Math.random() * 0.4 + 0.2 : (Math.random() - 0.5) * 0.3,
        vy: isSakura ? -(Math.random() * 0.6 + 0.4) : Math.random() * 0.5 + 0.2,
        vz: (Math.random() - 0.5) * 0.2,
        rx: (Math.random() - 0.5) * 0.03,
        ry: (Math.random() - 0.5) * 0.04,
        rz: (Math.random() - 0.5) * 0.02,
        initialY: mesh.position.y,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // 2. Active Region Beacon (3D Pulsing Ring at map coordinates)
    let beaconGroup: any = null;
    let ringMesh1: any = null;
    let ringMesh2: any = null;

    if (activeRegionCoords) {
      beaconGroup = new THREE.Group();
      // Map SVG (0..500) to Three.js coordinates (-120..120)
      const mappedX = (activeRegionCoords.x / 500 - 0.5) * 220;
      const mappedY = -(activeRegionCoords.y / 500 - 0.5) * 220;

      beaconGroup.position.set(mappedX, mappedY, 5);

      const ringGeom = new THREE.RingGeometry(4, 5.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      ringMesh1 = new THREE.Mesh(ringGeom, ringMat);

      const ringMat2 = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      ringMesh2 = new THREE.Mesh(ringGeom, ringMat2);

      beaconGroup.add(ringMesh1);
      beaconGroup.add(ringMesh2);
      scene.add(beaconGroup);
    }

    // Animation Loop
    let animId: number;
    let clock = 0;

    const animate = () => {
      clock += 0.02;

      // Wind current towards mouse position
      const mouse = mouseRef.current;
      const windTargetX = mouse.active ? mouse.x * 25 : 0;
      const windTargetY = mouse.active ? mouse.y * 25 : 0;

      particles.forEach((p, idx) => {
        p.mesh.rotation.x += p.rx;
        p.mesh.rotation.y += p.ry;
        p.mesh.rotation.z += p.rz;

        // Flutter oscillation
        const flutter = Math.sin(clock + p.phase) * 0.4;
        p.mesh.position.x += p.vx + flutter * 0.3;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;

        // Subtle wind drift near cursor
        if (mouse.active) {
          const dx = p.mesh.position.x - mouse.x * 120;
          const dy = p.mesh.position.y - mouse.y * 120;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            const force = (60 - dist) / 60;
            p.mesh.position.x += (dx / dist) * force * 1.5;
            p.mesh.position.y += (dy / dist) * force * 1.5;
          }
        }

        // Wrap around boundaries
        if (p.mesh.position.y < -130) p.mesh.position.y = 130;
        if (p.mesh.position.y > 130) p.mesh.position.y = -130;
        if (p.mesh.position.x > 140) p.mesh.position.x = -140;
        if (p.mesh.position.x < -140) p.mesh.position.x = 140;
      });

      // Beacon pulsing animation
      if (beaconGroup && ringMesh1 && ringMesh2) {
        const pulse1 = (clock * 1.8) % 2;
        ringMesh1.scale.set(1 + pulse1 * 1.8, 1 + pulse1 * 1.8, 1);
        ringMesh1.material.opacity = Math.max(0, 0.85 - pulse1 * 0.45);

        const pulse2 = ((clock * 1.8) + 1) % 2;
        ringMesh2.scale.set(1 + pulse2 * 1.8, 1 + pulse2 * 1.8, 1);
        ringMesh2.material.opacity = Math.max(0, 0.7 - pulse2 * 0.4);
      }

      // Parallax rotation towards cursor
      camera.position.x = (windTargetX - camera.position.x) * 0.05;
      camera.position.y = (windTargetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      petalGeom.dispose();
      spiritGeom.dispose();
      particles.forEach((p) => p.mesh.material.dispose());
      if (ringMesh1) ringMesh1.material.dispose();
      if (ringMesh2) ringMesh2.material.dispose();
    };
  }, [animationMode, activeRegionCoords, threeLoaded]);

  if (animationMode === "off") return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-2xl"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
