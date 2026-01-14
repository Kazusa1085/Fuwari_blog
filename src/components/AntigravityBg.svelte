<script lang="ts">
import { onMount, tick } from "svelte";

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | null;
let animationFrame: number;
let blurFollower: HTMLDivElement;

const mouse = {
	x: 0,
	y: 0,
	targetX: 0,
	targetY: 0,
};

interface Particle {
	x: number;
	y: number;
	angle: number;
	length: number;
	width: number;
	speed: number;
	depth: number;
	opacity: number;
	targetOpacity: number;
	color: string;
}

let particles: Particle[] = [];
const PARTICLE_COUNT = 450;
// 交互影响半径（与模糊层一致）
const INTERACTION_RADIUS = 300;

const colorsDark = [
	"rgba(56, 189, 248, 1)", // Sky
	"rgba(34, 211, 238, 1)", // Cyan
	"rgba(255, 255, 255, 1)", // White
];
const colorsLight = [
	"rgba(2, 132, 199, 1)", // Sky 600
	"rgba(3, 105, 161, 1)", // Sky 700
	"rgba(80, 80, 80, 1)", // Grey
];

function isDarkMode(): boolean {
	return document.documentElement.classList.contains("dark");
}

function initParticles(width: number, height: number) {
	particles = [];
	const isDark = isDarkMode();
	const palette = isDark ? colorsDark : colorsLight;

	for (let i = 0; i < PARTICLE_COUNT; i++) {
		particles.push({
			x: Math.random() * width,
			y: Math.random() * height,
			angle: Math.random() * Math.PI * 2,
			length: 3 + Math.random() * 5,
			width: 1.5 + Math.random() * 1.5,
			speed: 0.001 + Math.random() * 0.003,
			depth: 0.05 + Math.random() * 0.1,
			opacity: 0,
			targetOpacity: Math.random() * 0.4 + 0.15,
			color: palette[Math.floor(Math.random() * palette.length)],
		});
	}
}

function resize() {
	if (!canvas) return;
	const width = window.innerWidth;
	const height = window.innerHeight;
	canvas.width = width * window.devicePixelRatio;
	canvas.height = height * window.devicePixelRatio;
	if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	initParticles(width, height);
}

function draw() {
	if (!ctx || !canvas) return;

	const width = window.innerWidth;
	const height = window.innerHeight;

	mouse.x += (mouse.targetX - mouse.x) * 0.25;
	mouse.y += (mouse.targetY - mouse.y) * 0.25;

	if (blurFollower) {
		const x = mouse.x - 300; // 300 is radius
		const y = mouse.y - 300;
		blurFollower.style.transform = `translate3d(${x}px, ${y}px, 0)`;
	}

	ctx.clearRect(0, 0, width, height);

	const isDark = isDarkMode();
	ctx.lineCap = "round";
	for (const p of particles) {
		if (Math.abs(p.opacity - p.targetOpacity) < 0.01) {
			p.targetOpacity = Math.random() * 0.4 + 0.15;
		}
		p.opacity += (p.targetOpacity - p.opacity) * 0.03;

		p.angle += p.speed;

		const dx = p.x - mouse.x;
		const dy = p.y - mouse.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		let interactionX = 0;
		let interactionY = 0;

		// 1. 内层交互：强力排斥/扭曲 (半径 300px)
		// 与模糊层范围一致
		const INTERACTION_RADIUS = 300;
		if (dist < INTERACTION_RADIUS) {
			const force = Math.pow(
				(INTERACTION_RADIUS - dist) / INTERACTION_RADIUS,
				2,
			);
			interactionX = (dx / dist) * force * 20;
			interactionY = (dy / dist) * force * 20;
		}

		// 2. 外层交互：视差/牵引 (半径 约 3/5 屏幕宽度)
		// 恢复之前的 "offsetX/Y" 逻辑，但限制在局部范围内
		const PARALLAX_RADIUS = width * 0.6;
		let parallaxX = 0;
		let parallaxY = 0;

		if (dist < PARALLAX_RADIUS) {
			// 原有的全局视差公式
			const rawOffsetX = (mouse.x - width / 2) * p.depth * -0.8; // 稍微调大系数
			const rawOffsetY = (mouse.y - height / 2) * p.depth * -0.8;

			// 边缘衰减 (Fade out)
			// 在边缘处平滑减弱视差效果，避免截断
			let fade = 1.0;
			if (dist > PARALLAX_RADIUS * 0.5) {
				// 从 50% 处开始衰减
				fade = 1.0 - (dist - PARALLAX_RADIUS * 0.5) / (PARALLAX_RADIUS * 0.5);
			}

			parallaxX = rawOffsetX * fade;
			parallaxY = rawOffsetY * fade;
		}

		const drawX = p.x + interactionX + parallaxX;
		const drawY = p.y + interactionY + parallaxY;

		ctx.lineWidth = p.width;
		ctx.globalAlpha = p.opacity;
		ctx.strokeStyle = p.color;

		const dynamicLength = p.length;

		ctx.beginPath();
		ctx.moveTo(drawX, drawY);
		ctx.lineTo(
			drawX + Math.cos(p.angle) * dynamicLength,
			drawY + Math.sin(p.angle) * dynamicLength,
		);
		ctx.stroke();
		ctx.globalAlpha = 1.0;

		const margin = 50;
		if (p.x < -margin) p.x = width + margin;
		if (p.x > width + margin) p.x = -margin;
		if (p.y < -margin) p.y = height + margin;
		if (p.y > height + margin) p.y = -margin;
	}

	animationFrame = requestAnimationFrame(draw);
}

onMount(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		return;
	}

	ctx = canvas.getContext("2d");
	resize();
	window.addEventListener("resize", resize);

	const moveHandler = (e: MouseEvent) => {
		mouse.targetX = e.clientX;
		mouse.targetY = e.clientY;
	};
	const touchHandler = (e: TouchEvent) => {
		const touch = e.touches[0];
		if (touch) {
			mouse.targetX = touch.clientX;
			mouse.targetY = touch.clientY;
		}
	};

	window.addEventListener("mousemove", moveHandler);
	window.addEventListener("touchmove", touchHandler, { passive: true });
	window.addEventListener("touchstart", touchHandler, { passive: true });

	mouse.x = mouse.targetX = window.innerWidth / 2;
	mouse.y = mouse.targetY = window.innerHeight / 2;

	draw();

	return () => {
		window.removeEventListener("resize", resize);
		window.removeEventListener("mousemove", moveHandler);
		window.removeEventListener("touchmove", touchHandler);
		window.removeEventListener("touchstart", touchHandler);
		cancelAnimationFrame(animationFrame);
	};
});
</script>

<div class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
    <canvas bind:this={canvas} class="block w-full h-full absolute inset-0 z-10"
    ></canvas>

    <div
        bind:this={blurFollower}
        class="blur-follower absolute top-0 left-0 w-[600px] h-[600px] rounded-full z-0"
    ></div>

    <div
        class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] z-20"
    ></div>
</div>

<style>
    .blur-follower {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        -webkit-mask-image: radial-gradient(
            closest-side,
            rgba(0, 0, 0, 1) 0%,
            rgba(0, 0, 0, 0.8) 40%,
            rgba(0, 0, 0, 0) 100%
        );
        mask-image: radial-gradient(
            closest-side,
            rgba(0, 0, 0, 1) 0%,
            rgba(0, 0, 0, 0.8) 40%,
            rgba(0, 0, 0, 0) 100%
        );
        will-change: transform;
        transform: translate3d(0, 0, 0);
    }

    canvas {
        filter: none;
    }
</style>
