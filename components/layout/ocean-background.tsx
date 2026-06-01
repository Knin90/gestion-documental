"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

const NOISE_GLSL = `
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`;

export function OceanBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    async function init() {
      const THREE = await import("three");

      if (!mounted || !containerRef.current) return;

      const container = containerRef.current;
      const gu = { time: { value: 0 } };

      // ToQuads helper
      const ToQuads = (g: THREE.BufferGeometry & { parameters?: any; type?: string }) => {
        const p = g.parameters;
        const segmentsX = (g.type === "TorusGeometry" ? p.tubularSegments : p.radialSegments) || p.widthSegments || p.thetaSegments || 1;
        const segmentsY = (g.type === "TorusGeometry" ? p.radialSegments : p.tubularSegments) || p.heightSegments || p.phiSegments || p.segments || 1;
        const indices: number[] = [];
        for (let i = 0; i < segmentsY + 1; i++) {
          let index11 = 0;
          let index12 = 0;
          for (let j = 0; j < segmentsX; j++) {
            index11 = (segmentsX + 1) * i + j;
            index12 = index11 + 1;
            const index21 = index11;
            const index22 = index11 + (segmentsX + 1);
            indices.push(index11, index12);
            if (index22 < (segmentsX + 1) * (segmentsY + 1) - 1) {
              indices.push(index21, index22);
            }
          }
          if (index12 + segmentsX + 1 <= (segmentsX + 1) * (segmentsY + 1) - 1) {
            indices.push(index12, index12 + segmentsX + 1);
          }
        }
        g.setIndex(indices);
      };

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#024");
      scene.fog = new THREE.Fog(scene.background, 8, 30);

      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 500);
      camera.position.set(0.5, 0.25, -1).setLength(7.25);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      // Background sphere
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = 1;
      bgCanvas.height = 1024;
      const bgCtx = bgCanvas.getContext("2d")!;
      const grd = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
      grd.addColorStop(0.1, "#044");
      grd.addColorStop(0.4, "#" + scene.background.getHexString());
      bgCtx.fillStyle = grd;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      const bgTex = new THREE.CanvasTexture(bgCanvas);
      bgTex.colorSpace = THREE.SRGBColorSpace;

      const bgSphere = new THREE.Mesh(
        new THREE.SphereGeometry(300),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, color: "white", map: bgTex })
      );
      scene.add(bgSphere);

      // SeaBed
      const seaG = new THREE.PlaneGeometry(100, 100, 400, 400).rotateX(-Math.PI * 0.5).rotateY(Math.PI * 0.25);
      ToQuads(seaG as any);
      const seaM = new THREE.MeshBasicMaterial({ color: "#048" });
      seaM.onBeforeCompile = (shader: any) => {
        shader.uniforms.time = gu.time;
        shader.vertexShader = `
            uniform float time;
            varying float vN;
            varying vec3 vPos;
            ${NOISE_GLSL}
            ${shader.vertexShader}
          `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
            float t = time;
            float posX = position.x - mod(t, 2. * sqrt(2.));
            transformed.x = posX;
            float xShift = posX + t;
            float n = snoise(vec2(xShift, position.z) * 0.1);
            vN = n;
            transformed.y = n * 1.;
            vPos = transformed;`
        );
        shader.fragmentShader = `
            varying float vN;
            varying vec3 vPos;
            ${shader.fragmentShader}
          `.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `vec3 col = mix(diffuse, vec3(0, 0.75, 1), 1. - smoothstep(-0.5, 0., vN));
            col += vec3(0, 0.2, 0.1) * (1. - smoothstep(10., 15., length(vPos)));
            vec4 diffuseColor = vec4( col, opacity );`
        );
      };
      const seaBed = new THREE.LineSegments(seaG, seaM);
      seaBed.position.y = -5;
      scene.add(seaBed);

      // Water stuff (floating capsules)
      const waterGroup = new THREE.Group();
      const capsuleG = new THREE.CapsuleGeometry(0.25, 2, 3, 7);
      const capsuleM = new THREE.MeshBasicMaterial({ wireframe: true, color: "#068" });

      interface WaterItem extends THREE.Mesh {
        userData: { initialX: number };
      }

      const setRandom = (o: THREE.Mesh, x: number) => {
        const a = Math.PI * Math.random();
        const r = 5 + Math.random() * 10;
        o.position.set(x, Math.sin(a) * r, Math.cos(a) * r);
        o.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        o.scale.y = 1 + (Math.random() - 0.5) * 1.5;
      };

      const waterItems: THREE.Mesh[] = [];
      for (let i = 0; i < 50; i++) {
        const item = new THREE.Mesh(capsuleG, capsuleM);
        setRandom(item, 50 - Math.random() * 100);
        waterGroup.add(item);
        waterItems.push(item);
      }
      scene.add(waterGroup);

      // Manta ray (Thing)
      const thingGroup = new THREE.Group();
      const sphereG = new THREE.SphereGeometry(3, 64, 32);
      const edgesG = new THREE.EdgesGeometry(sphereG, 0.5);
      const lineM = new THREE.LineBasicMaterial({ color: "#8ff", transparent: true, opacity: 0.75 });
      const pointM = new THREE.PointsMaterial({ color: "#0ff", size: 0.1, transparent: true });

      [lineM, pointM].forEach((m: any) => {
        m.onBeforeCompile = (shader: any) => {
          shader.uniforms.time = gu.time;
          shader.vertexShader = `
            uniform float time;
            varying vec3 vPos;
            mat2 rot(float a){return mat2(cos(a), sin(a), -sin(a), cos(a));}
            ${shader.vertexShader}
          `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
            vec3 pos = position;
            vPos = pos;
            pos.y *= 0.05;
            float a = atan(pos.z, pos.x);
            float s = cos(a * 4.);
            float r = s * 0.125 + 0.875;
            pos.xz *= r;
            pos.x -= (smoothstep(0., 3., pos.x)) * 0.75;
            float syncWave = sin(time * 1.25 + pos.x);
            float zSwaying = smoothstep(0.25, 2., abs(pos.z));
            mat2 zRot = rot(PI * 0.1 * zSwaying * syncWave * sign(pos.z));
            pos.yz *= zRot;
            pos.y += syncWave * 0.5 * ((1. - smoothstep(-3., 3., position.x)) * 0.5 + 0.5);
            transformed = pos;`
          );

          if (m.type === "PointsMaterial") {
            shader.fragmentShader = `
              varying vec3 vPos;
              ${shader.fragmentShader}
            `.replace(
              `vec4 diffuseColor = vec4( diffuse, opacity );`,
              `vec2 uv = gl_PointCoord - 0.5;
              float pl = length(uv);
              float fw = length(fwidth(uv));
              float f = 1. - smoothstep(0.5 - fw, 0.5, pl);
              if (pl > 0.5) discard;
              vec3 bodyColor = mix(vec3(1), diffuse, smoothstep(2., 1., vPos.x));
              vec3 col = mix(bodyColor, diffuse, smoothstep(0.5, 1.0, abs(vPos.z)));
              vec4 diffuseColor = vec4( col, opacity * f );`
            );
          }
        };
      });

      const lines = new THREE.LineSegments(edgesG, lineM);
      thingGroup.add(lines);

      // Merge vertices for points
      const pointsG = sphereG.clone().deleteAttribute("uv").deleteAttribute("normal");
      const mergedG = mergeVertices(pointsG);
      const points = new THREE.Points(mergedG, pointM);
      thingGroup.add(points);
      thingGroup.position.y = 1;
      scene.add(thingGroup);

      // Simple mergeVertices
      function mergeVertices(geometry: THREE.BufferGeometry, tolerance = 1e-4) {
        const posAttr = geometry.getAttribute("position");
        const hashMap = new Map<string, number>();
        const newPositions: number[] = [];
        const newIndices: number[] = [];

        for (let i = 0; i < posAttr.count; i++) {
          const x = Math.round(posAttr.getX(i) / tolerance) * tolerance;
          const y = Math.round(posAttr.getY(i) / tolerance) * tolerance;
          const z = Math.round(posAttr.getZ(i) / tolerance) * tolerance;
          const key = `${x},${y},${z}`;

          if (!hashMap.has(key)) {
            hashMap.set(key, newPositions.length / 3);
            newPositions.push(x, y, z);
          }
          newIndices.push(hashMap.get(key)!);
        }

        const newG = new THREE.BufferGeometry();
        newG.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
        newG.setIndex(newIndices);
        return newG;
      }

      // Orbit-like auto rotation
      let angle = 0;

      // Resize
      const onResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener("resize", onResize);

      // Animation
      const clock = new THREE.Clock();
      let animId = 0;

      function animate() {
        if (!mounted) return;
        animId = requestAnimationFrame(animate);

        const dt = clock.getDelta();
        gu.time.value += dt * 1.25;

        // Auto orbit
        angle += dt * 0.15;
        camera.position.x = Math.sin(angle) * 7.25;
        camera.position.z = Math.cos(angle) * -7.25;
        camera.position.y = 0.25 + Math.sin(angle * 0.5) * 0.5;
        camera.lookAt(0, 0, 0);

        // Update water stuff
        const lim = 50;
        waterItems.forEach((item) => {
          item.position.x -= dt;
          if (item.position.x < -lim) {
            setRandom(item, lim + ((item.position.x + lim) % 100));
          }
        });

        renderer.render(scene, camera);
      }
      animate();

      cleanupRef.current = () => {
        mounted = false;
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
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
        zIndex: 0,
      }}
    />
  );
}
