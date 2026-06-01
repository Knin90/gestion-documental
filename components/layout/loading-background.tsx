"use client";

import { useEffect, useRef } from "react";

export function LoadingBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    async function init() {
      const THREE = await import("three");
      if (!mounted || !containerRef.current) return;

      const container = containerRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, 0, 150);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setClearColor(0x000000);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d")!;
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.2, "#00ffff");
      gradient.addColorStop(0.4, "#000040");
      gradient.addColorStop(1, "#000000");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
      const texture = new THREE.CanvasTexture(canvas);

      const geometry = new THREE.TorusKnotGeometry(100, 40, 512, 64, 2, 3);
      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 3,
        transparent: true,
        map: texture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const pointCloud = new THREE.Points(geometry, material);
      scene.add(pointCloud);

      let step = 0;
      const startTime = Date.now();
      let animId = 0;

      function animate() {
        if (!mounted || Date.now() - startTime > 1000) return;
        animId = requestAnimationFrame(animate);
        step += 0.01;
        pointCloud.rotation.x = step;
        pointCloud.rotation.z = step;
        renderer.render(scene, camera);
      }

      function onResize() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      }

      window.addEventListener("resize", onResize);
      animate();

      cleanupRef.current = () => {
        mounted = false;
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        texture.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    init();

    return () => {
      mounted = false;
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundColor: "#000",
      }}
    />
  );
}
