import * as THREE from "three";

/* Ported from the former React/@react-three/fiber AntigravityBg island.
 * Kept as a framework-free module so React (~200 KB) and
 * @react-three/fiber are no longer shipped to the browser at all, and so
 * that three.js can be loaded lazily after first paint.
 *
 * The visual behaviour is intentionally identical to the React version:
 * 280 instanced capsule particles, mouse magnet/ring behaviour, a moving
 * blurred follower and a noise overlay.
 */

type MousePoint = { x: number; y: number };

const COLORS_DARK = ["#38bdf8", "#22d3ee", "#ffffff"];
const COLORS_LIGHT = ["#0284c7", "#0369a1", "#505050"];

interface Particle {
	t: number;
	speed: number;
	mx: number;
	my: number;
	mz: number;
	cx: number;
	cy: number;
	cz: number;
	randomRadiusOffset: number;
}

export interface AntigravityOptions {
	count?: number;
	magnetRadius?: number;
	ringRadius?: number;
	waveSpeed?: number;
	waveAmplitude?: number;
	particleSize?: number;
	lerpSpeed?: number;
	particleVariance?: number;
	rotationSpeed?: number;
	depthFactor?: number;
	pulseSpeed?: number;
	fieldStrength?: number;
}

const NOISE_SVG =
	"url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')";

function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDark(): boolean {
	return document.documentElement.classList.contains("dark");
}

function viewportAtZ(
	camera: THREE.PerspectiveCamera,
	aspect: number,
	z: number,
) {
	const height = 2 * Math.tan((camera.fov * Math.PI) / 360) * Math.abs(z);
	return { width: height * aspect, height };
}

function makeParticles(
	count: number,
	width: number,
	height: number,
): Particle[] {
	const list: Particle[] = [];
	for (let i = 0; i < count; i += 1) {
		const t = Math.random() * 100;
		const speed = 0.01 + Math.random() / 200;
		const x = (Math.random() - 0.5) * width;
		const y = (Math.random() - 0.5) * height;
		const z = (Math.random() - 0.5) * 20;
		const randomRadiusOffset = (Math.random() - 0.5) * 2;
		list.push({
			t,
			speed,
			mx: x,
			my: y,
			mz: z,
			cx: x,
			cy: y,
			cz: z,
			randomRadiusOffset,
		});
	}
	return list;
}

function setPalette(mesh: THREE.InstancedMesh, count: number) {
	const palette = isDark() ? COLORS_DARK : COLORS_LIGHT;
	const color = new THREE.Color();
	for (let i = 0; i < count; i += 1) {
		color.set(palette[Math.floor(Math.random() * palette.length)]);
		mesh.setColorAt(i, color);
	}
	if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

/**
 * Mount the animated background into a host element.
 * Returns a cleanup function. The host must be an empty positioned element.
 */
export function startAntigravityBackground(
	host: HTMLElement,
	options: AntigravityOptions = {},
): () => void {
	if (prefersReducedMotion()) return () => {};

	const count = options.count ?? (window.innerWidth < 1200 ? 180 : 280);
	const magnetRadius = options.magnetRadius ?? 10;
	const ringRadius = options.ringRadius ?? 10;
	const waveSpeed = options.waveSpeed ?? 0.4;
	const waveAmplitude = options.waveAmplitude ?? 1;
	const particleSize = options.particleSize ?? 1.8;
	const lerpSpeed = options.lerpSpeed ?? 0.1;
	const particleVariance = options.particleVariance ?? 1;
	const rotationSpeed = options.rotationSpeed ?? 0;
	const depthFactor = options.depthFactor ?? 1;
	const pulseSpeed = options.pulseSpeed ?? 3;
	const fieldStrength = options.fieldStrength ?? 10;

	const canvasHost = document.createElement("div");
	canvasHost.style.cssText = "position:absolute;inset:0;z-index:10;";
	host.appendChild(canvasHost);

	const renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: false,
		powerPreference: "low-power",
	});
	renderer.setClearColor(0x000000, 0);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
	renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
	canvasHost.appendChild(renderer.domElement);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
	camera.position.set(0, 0, 50);

	const geometry = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
	const material = new THREE.MeshBasicMaterial({ toneMapped: false });
	const mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
	scene.add(mesh);
	setPalette(mesh, count);

	const dummy = new THREE.Object3D();
	const colorTimer = { lastDark: isDark() };
	const observer = new MutationObserver(() => {
		const dark = isDark();
		if (dark !== colorTimer.lastDark) {
			colorTimer.lastDark = dark;
			setPalette(mesh, count);
		}
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	let aspect = 1;
	let viewport = { width: 100, height: 100 };
	let particles: Particle[] = [];

	const rebuild = () => {
		aspect = Math.max(window.innerWidth, 1) / Math.max(window.innerHeight, 1);
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
		const size = viewportAtZ(camera, aspect, camera.position.z);
		viewport = size;
		particles = makeParticles(count, size.width, size.height);
	};
	rebuild();

	const mouse: MousePoint = { x: 0, y: 0 };
	const virtualMouse = { x: 0, y: 0 };
	const onPointer = (x: number, y: number) => {
		mouse.x = (x / window.innerWidth) * 2 - 1;
		mouse.y = -(y / window.innerHeight) * 2 + 1;
	};
	const onMouseMove = (event: MouseEvent) =>
		onPointer(event.clientX, event.clientY);
	const onTouchMove = (event: TouchEvent) => {
		const touch = event.touches[0];
		if (touch) onPointer(touch.clientX, touch.clientY);
	};
	window.addEventListener("mousemove", onMouseMove, { passive: true });
	window.addEventListener("touchmove", onTouchMove, { passive: true });
	window.addEventListener("touchstart", onTouchMove, { passive: true });

	const update = () => {
		const elapsed = performance.now() / 1000;
		virtualMouse.x += ((mouse.x * viewport.width) / 2 - virtualMouse.x) * 0.05;
		virtualMouse.y += ((mouse.y * viewport.height) / 2 - virtualMouse.y) * 0.05;
		const tx = virtualMouse.x;
		const ty = virtualMouse.y;
		const globalRotation = elapsed * rotationSpeed;
		for (let i = 0; i < particles.length; i += 1) {
			const particle = particles[i];
			particle.t += particle.speed / 2;
			const t = particle.t;
			const projectionFactor = 1 - particle.cz / 50;
			const projectedTargetX = tx * projectionFactor;
			const projectedTargetY = ty * projectionFactor;
			const dx = particle.mx - projectedTargetX;
			const dy = particle.my - projectedTargetY;
			const dist = Math.sqrt(dx * dx + dy * dy);
			let targetPosX = particle.mx;
			let targetPosY = particle.my;
			let targetPosZ = particle.mz * depthFactor;
			if (dist < magnetRadius) {
				const angle = Math.atan2(dy, dx) + globalRotation;
				const moveDist = dist < magnetRadius * 0.6 ? magnetRadius : dist;
				if (moveDist === magnetRadius) {
					const wave = Math.sin(t * waveSpeed + angle) * (0.5 * waveAmplitude);
					const deviation =
						particle.randomRadiusOffset * (5 / (fieldStrength + 0.1));
					const currentRingRadius = ringRadius + wave + deviation;
					targetPosX = projectedTargetX + currentRingRadius * Math.cos(angle);
					targetPosY = projectedTargetY + currentRingRadius * Math.sin(angle);
					targetPosZ =
						particle.mz * depthFactor +
						Math.sin(t) * (waveAmplitude * depthFactor);
				} else {
					targetPosX =
						projectedTargetX + dist * Math.cos(angle - globalRotation);
					targetPosY =
						projectedTargetY + dist * Math.sin(angle - globalRotation);
					targetPosZ =
						particle.mz * depthFactor +
						Math.sin(t * pulseSpeed) * (0.5 * waveAmplitude);
				}
			}
			particle.cx += (targetPosX - particle.cx) * lerpSpeed;
			particle.cy += (targetPosY - particle.cy) * lerpSpeed;
			particle.cz += (targetPosZ - particle.cz) * lerpSpeed;
			dummy.position.set(particle.cx, particle.cy, particle.cz);
			dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz);
			dummy.rotateX(Math.PI / 2);
			const currentDistToMouse = Math.sqrt(
				(particle.cx - projectedTargetX) ** 2 +
					(particle.cy - projectedTargetY) ** 2,
			);
			const distFromRing = Math.abs(currentDistToMouse - ringRadius);
			let scaleFactor = 1 - distFromRing / 10;
			scaleFactor = Math.max(0, Math.min(1, scaleFactor));
			const finalScale =
				scaleFactor *
				(0.8 + Math.sin(t * pulseSpeed) * 0.2 * particleVariance) *
				particleSize;
			dummy.scale.setScalar(finalScale);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
		renderer.render(scene, camera);
	};
	renderer.setAnimationLoop(update);

	const onResize = () => {
		renderer.setSize(window.innerWidth, window.innerHeight, false);
		rebuild();
	};
	onResize();
	window.addEventListener("resize", onResize, { passive: true });

	// Blur follower (cheap DOM element, same visual as the React version).
	const follower = document.createElement("div");
	follower.style.cssText = [
		"position:absolute",
		"top:0",
		"left:0",
		"width:600px",
		"height:600px",
		"border-radius:9999px",
		"z-index:0",
		"pointer-events:none",
		"backdrop-filter:blur(8px)",
		"-webkit-backdrop-filter:blur(8px)",
		"mask-image:radial-gradient(closest-side, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)",
		"-webkit-mask-image:radial-gradient(closest-side, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)",
		"will-change:transform",
	].join(";");
	host.appendChild(follower);
	const onFollow = (x: number, y: number) => {
		follower.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`;
	};
	const onFollowMouse = (event: MouseEvent) =>
		onFollow(event.clientX, event.clientY);
	const onFollowTouch = (event: TouchEvent) => {
		const touch = event.touches[0];
		if (touch) onFollow(touch.clientX, touch.clientY);
	};
	window.addEventListener("mousemove", onFollowMouse, { passive: true });
	window.addEventListener("touchmove", onFollowTouch, { passive: true });
	window.addEventListener("touchstart", onFollowTouch, { passive: true });

	const noise = document.createElement("div");
	noise.style.cssText =
		"position:absolute;inset:0;z-index:20;pointer-events:none;opacity:0.03;background-image:" +
		NOISE_SVG;
	host.appendChild(noise);

	const onVisibility = () => {
		if (document.hidden) {
			renderer.setAnimationLoop(null);
		} else {
			renderer.setAnimationLoop(update);
		}
	};
	document.addEventListener("visibilitychange", onVisibility);

	const dispose = () => {
		renderer.setAnimationLoop(null);
		document.removeEventListener("visibilitychange", onVisibility);
		window.removeEventListener("mousemove", onMouseMove);
		window.removeEventListener("touchmove", onTouchMove);
		window.removeEventListener("touchstart", onTouchMove);
		window.removeEventListener("mousemove", onFollowMouse);
		window.removeEventListener("touchmove", onFollowTouch);
		window.removeEventListener("touchstart", onFollowTouch);
		window.removeEventListener("resize", onResize);
		observer.disconnect();
		geometry.dispose();
		material.dispose();
		renderer.dispose();
		canvasHost.remove();
		follower.remove();
		noise.remove();
	};
	window.addEventListener("pagehide", dispose, { once: true });
	return dispose;
}
