"use client";

import { useEffect, useRef } from "react";

interface MagicRingsProps {
  color?: string;
  colorTwo?: string;
  ringCount?: number;
  rotationSpeed?: number;
  lineThickness?: number;
  glowIntensity?: number;
  pulseSpeed?: number;
  className?: string;
}

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform vec3 uColorTwo;
uniform float uRingCount;
uniform float uRotationSpeed;
uniform float uLineThickness;
uniform float uGlowIntensity;
uniform float uPulseSpeed;
varying vec2 vUv;

#define PI 3.14159265359

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float ring(vec2 uv, float radius, float thickness, float time, float idx) {
  float angle = atan(uv.y, uv.x);
  float dist = length(uv);

  float wave = sin(angle * 3.0 + time * uRotationSpeed + idx * 1.5) * 0.02;
  wave += sin(angle * 5.0 - time * uRotationSpeed * 0.7 + idx * 2.0) * 0.01;

  float pulse = sin(time * uPulseSpeed + idx * 0.8) * 0.01;

  float r = radius + wave + pulse;
  float d = abs(dist - r);

  float glow = uGlowIntensity * 0.005 / (d + 0.005);
  float line = smoothstep(thickness, 0.0, d);

  return line + glow;
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= uResolution.x / uResolution.y;

  float time = uTime;
  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 10.0; i++) {
    if (i >= uRingCount) break;

    float radius = 0.2 + i * 0.08;
    float angle = time * uRotationSpeed * (0.3 + i * 0.1) * (mod(i, 2.0) == 0.0 ? 1.0 : -1.0);

    vec2 rotUv = rotate2d(angle) * uv;
    float t = uLineThickness * (0.8 + sin(time + i) * 0.2);

    float r = ring(rotUv, radius, t, time, i);

    float mixer = i / max(uRingCount - 1.0, 1.0);
    vec3 ringColor = mix(uColor, uColorTwo, mixer);

    float flicker = 0.8 + 0.2 * sin(time * 3.0 + i * 1.7);
    col += r * ringColor * flicker;
  }

  col = 1.0 - exp(-col * 1.5);

  gl_FragColor = vec4(col, col.r * 0.5 + col.g * 0.3 + col.b * 0.2);
}
`;

function hexToRgbNorm(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

export default function MagicRings({
  color = "#fc42ff",
  colorTwo = "#42fcff",
  ringCount = 6,
  rotationSpeed = 1.0,
  lineThickness = 0.005,
  glowIntensity = 1.0,
  pulseSpeed = 1.0,
  className,
}: MagicRingsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({
    color,
    colorTwo,
    ringCount,
    rotationSpeed,
    lineThickness,
    glowIntensity,
    pulseSpeed,
  });
  propsRef.current = {
    color,
    colorTwo,
    ringCount,
    rotationSpeed,
    lineThickness,
    glowIntensity,
    pulseSpeed,
  };

  useEffect(() => {
    const ctn = containerRef.current;
    if (!ctn) return;

    let cancelled = false;
    let animId = 0;

    async function init() {
      const THREE = await import("three");
      if (cancelled) return;

      const width = ctn!.offsetWidth;
      const height = ctn!.offsetHeight;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      ctn!.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const p = propsRef.current;
      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uColor: { value: new THREE.Vector3(...hexToRgbNorm(p.color)) },
        uColorTwo: { value: new THREE.Vector3(...hexToRgbNorm(p.colorTwo)) },
        uRingCount: { value: p.ringCount },
        uRotationSpeed: { value: p.rotationSpeed },
        uLineThickness: { value: p.lineThickness },
        uGlowIntensity: { value: p.glowIntensity },
        uPulseSpeed: { value: p.pulseSpeed },
      };

      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
        depthWrite: false,
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      function onResize() {
        if (!ctn) return;
        const w = ctn.offsetWidth;
        const h = ctn.offsetHeight;
        renderer.setSize(w, h);
        uniforms.uResolution.value.set(w, h);
      }
      window.addEventListener("resize", onResize);

      const clock = new THREE.Clock();

      function animate() {
        if (cancelled) return;
        animId = requestAnimationFrame(animate);

        const cur = propsRef.current;
        uniforms.uTime.value = clock.getElapsedTime();
        uniforms.uColor.value.set(...hexToRgbNorm(cur.color));
        uniforms.uColorTwo.value.set(...hexToRgbNorm(cur.colorTwo));
        uniforms.uRingCount.value = cur.ringCount;
        uniforms.uRotationSpeed.value = cur.rotationSpeed;
        uniforms.uLineThickness.value = cur.lineThickness;
        uniforms.uGlowIntensity.value = cur.glowIntensity;
        uniforms.uPulseSpeed.value = cur.pulseSpeed;

        renderer.render(scene, camera);
      }
      animId = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        if (ctn && renderer.domElement.parentNode === ctn) {
          ctn.removeChild(renderer.domElement);
        }
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
    />
  );
}
