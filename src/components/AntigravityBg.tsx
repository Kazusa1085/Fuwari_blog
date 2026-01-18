/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const colorsDark = [
	"#38bdf8", // Sky
	"#22d3ee", // Cyan
	"#ffffff", // White
];
const colorsLight = [
	"#0284c7", // Sky 600
	"#0369a1", // Sky 700
	"#505050", // Grey
];

const AntigravityInner = ({
  count = 280, // Adjusted to 280
  magnetRadius = 10,
  ringRadius = 10,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 1.8, // Adjusted to 1.8
  lerpSpeed = 0.1,
  autoAnimate = false,
  particleVariance = 1,
  rotationSpeed = 0,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = 'capsule',
  fieldStrength = 10,
  isDarkMode = false // Passed prop
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArray = useMemo(() => new Float32Array(count * 3), [count]);

  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseMoveTime = useRef(0);
  const virtualMouse = useRef({ x: 0, y: 0 });

  const particles = useMemo(() => {
    const temp = [];
    const width = viewport.width || 100;
    const height = viewport.height || 100;
    const palette = isDarkMode ? colorsDark : colorsLight;
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
        // ... existing random generation ...
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;

      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const z = (Math.random() - 0.5) * 20;

      const randomRadiusOffset = (Math.random() - 0.5) * 2;
      
      // Color assignment
      const colorHex = palette[Math.floor(Math.random() * palette.length)];
      tempColor.set(colorHex);
      tempColor.toArray(colorArray, i * 3);

      temp.push({
        t,
        factor,
        speed,
        xFactor,
        yFactor,
        zFactor,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        vx: 0,
        vy: 0,
        vz: 0,
        randomRadiusOffset
      });
    }
    return temp;
  }, [count, viewport.width, viewport.height, isDarkMode]); // Re-calc on dark mode change

  // ... useEffect for mouse tracking (kept same) ...
  useEffect(() => {
    const handleMove = (x: number, y: number) => {
      // Normalize to -1 to 1 based on window size
      const nx = (x / window.innerWidth) * 2 - 1;
      const ny = -(y / window.innerHeight) * 2 + 1;
      
      lastMouseMoveTime.current = Date.now();
      lastMousePos.current = { x: nx, y: ny };
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
        if(e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchMove);
    };
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Update color attribute if changed
    if (mesh.geometry.attributes.color) {
        mesh.geometry.attributes.color.needsUpdate = true;
    }

    const { viewport: v } = state;

    // Use the tracked global mouse position instead of state.pointer
    const m = lastMousePos.current;

    let destX = (m.x * v.width) / 2;
    let destY = (m.y * v.height) / 2;

    if (autoAnimate && Date.now() - lastMouseMoveTime.current > 2000) {
      const time = state.clock.getElapsedTime();
      destX = Math.sin(time * 0.5) * (v.width / 4);
      destY = Math.cos(time * 0.5 * 2) * (v.height / 4);
    }

    const smoothFactor = 0.05;
    virtualMouse.current.x += (destX - virtualMouse.current.x) * smoothFactor;
    virtualMouse.current.y += (destY - virtualMouse.current.y) * smoothFactor;

    const targetX = virtualMouse.current.x;
    const targetY = virtualMouse.current.y;

    const globalRotation = state.clock.getElapsedTime() * rotationSpeed;

    particles.forEach((particle, i) => {
      let { t, speed, mx, my, mz, cz, randomRadiusOffset } = particle;

      t = particle.t += speed / 2;

      const projectionFactor = 1 - cz / 50;
      const projectedTargetX = targetX * projectionFactor;
      const projectedTargetY = targetY * projectionFactor;

      const dx = mx - projectedTargetX;
      const dy = my - projectedTargetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let targetPos = { x: mx, y: my, z: mz * depthFactor };

      if (dist < magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;
        const moveDist = dist < magnetRadius * 0.6 ? magnetRadius : dist; 

        // 60% inner radius is kept clear
        if (moveDist === magnetRadius) {
            const wave = Math.sin(t * waveSpeed + angle) * (0.5 * waveAmplitude);
            const deviation = randomRadiusOffset * (5 / (fieldStrength + 0.1));
            const currentRingRadius = ringRadius + wave + deviation;

            targetPos.x = projectedTargetX + currentRingRadius * Math.cos(angle);
            targetPos.y = projectedTargetY + currentRingRadius * Math.sin(angle);
            targetPos.z = mz * depthFactor + Math.sin(t) * (1 * waveAmplitude * depthFactor);
        } else {
             // Outer 40% allows particles, but adds wave/pulse effect
             targetPos.x = projectedTargetX + dist * Math.cos(angle - globalRotation); // keep original angle
             targetPos.y = projectedTargetY + dist * Math.sin(angle - globalRotation);
             // Add some Z movement to animate them
             targetPos.z = mz * depthFactor + Math.sin(t * pulseSpeed) * (0.5 * waveAmplitude);
        }
      }

      particle.cx += (targetPos.x - particle.cx) * lerpSpeed;
      particle.cy += (targetPos.y - particle.cy) * lerpSpeed;
      particle.cz += (targetPos.z - particle.cz) * lerpSpeed;

      dummy.position.set(particle.cx, particle.cy, particle.cz);

      dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz);
      dummy.rotateX(Math.PI / 2);

      const currentDistToMouse = Math.sqrt(
        Math.pow(particle.cx - projectedTargetX, 2) + Math.pow(particle.cy - projectedTargetY, 2)
      );

      const distFromRing = Math.abs(currentDistToMouse - ringRadius);
      let scaleFactor = 1 - distFromRing / 10;

      scaleFactor = Math.max(0, Math.min(1, scaleFactor));

      const finalScale = scaleFactor * (0.8 + Math.sin(t * pulseSpeed) * 0.2 * particleVariance) * particleSize;
      dummy.scale.set(finalScale, finalScale, finalScale);

      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {particleShape === 'capsule' && <capsuleGeometry args={[0.1, 0.4, 4, 8]} >
         <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </capsuleGeometry>}
      {particleShape === 'sphere' && <sphereGeometry args={[0.2, 16, 16]} >
         <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </sphereGeometry>}
      {particleShape === 'box' && <boxGeometry args={[0.3, 0.3, 0.3]} >
         <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </boxGeometry>}
      {particleShape === 'tetrahedron' && <tetrahedronGeometry args={[0.3]} >
         <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </tetrahedronGeometry>}
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
};

const BlurFollower = () => {
    const followerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (followerRef.current) {
                const x = e.clientX - 300; // 300 is half of width/height
                const y = e.clientY - 300;
                followerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (followerRef.current && e.touches[0]) {
                const touch = e.touches[0];
                const x = touch.clientX - 300;
                const y = touch.clientY - 300;
                followerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchMove, { passive: true });
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchMove);
        };
    }, []);

    return (
        <div
            ref={followerRef}
            className="blur-follower absolute top-0 left-0 w-[600px] h-[600px] rounded-full z-0 pointer-events-none"
            style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                maskImage: 'radial-gradient(closest-side, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'radial-gradient(closest-side, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)',
                willChange: 'transform',
            }}
        />
    );
};

const Antigravity = (props: any) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [particleCount, setParticleCount] = useState(100);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleResize = () => {
             if (window.innerWidth < 768) {
                 setParticleCount(100);
             } else {
                 setParticleCount(280);
             }
        };

        handleResize(); // Check initial size
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const particleColor = isDarkMode ? '#38bdf8' : '#0284c7';

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 z-10 w-full h-full">
            <Canvas camera={{ position: [0, 0, 50], fov: 35 }}>
                <AntigravityInner {...props} count={particleCount} isDarkMode={isDarkMode} />
            </Canvas>
        </div>
        <BlurFollower />
        <div
             className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-20"
             style={{
                backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')`
             }}
        ></div>
    </div>
  );
};

export default Antigravity;
