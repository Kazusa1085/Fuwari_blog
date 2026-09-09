import type { AntiLeechConfig } from "@/types/config";

const SESSION_KEY = "domain-warning-dismissed";
const STYLE_ID = "domain-warning-style";
const OVERLAY_ID = "domain-warning-overlay";

interface OfficialSite {
	url: string;
	name?: string;
}

function normalizeSites(
	sites: AntiLeechConfig["officialSites"],
): OfficialSite[] {
	return sites.map((site) => (typeof site === "string" ? { url: site } : site));
}

function isLocalOrPreview(hostname: string): boolean {
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname.endsWith(".vercel.app")
	);
}

function showWarning(config: AntiLeechConfig, sites: OfficialSite[]): void {
	if (document.getElementById(OVERLAY_ID)) return;

	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = `
		.domain-warning-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.68);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:domain-warning-fade-in .3s ease}
		.domain-warning-modal{box-sizing:border-box;width:min(440px,90vw);padding:32px;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:linear-gradient(145deg,rgba(28,28,38,.98),rgba(18,18,28,.99));box-shadow:0 24px 60px -18px rgba(0,0,0,.65);animation:domain-warning-rise .35s ease}
		.domain-warning-icon{width:56px;height:56px;margin:0 auto 16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;background:linear-gradient(135deg,#f97316,#ef4444)}
		.domain-warning-title{color:#fff;font-size:19px;font-weight:700;text-align:center;margin-bottom:14px}
		.domain-warning-text{color:rgba(255,255,255,.72);font-size:14px;line-height:1.65;text-align:center}
		.domain-warning-host{display:inline-block;margin:10px 0;padding:4px 10px;border-radius:8px;background:rgba(239,68,68,.16);color:#fca5a5;font-family:monospace;font-size:13px}
		.domain-warning-actions{display:flex;gap:12px;margin-top:24px}
		.domain-warning-btn{flex:1;padding:12px 16px;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}
		.domain-warning-btn:hover{transform:translateY(-1px)}
		.domain-warning-btn-go{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
		.domain-warning-btn-stay{background:rgba(255,255,255,.08);color:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.12)}
		@keyframes domain-warning-fade-in{from{opacity:0}to{opacity:1}}
		@keyframes domain-warning-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
	`;

	const overlay = document.createElement("div");
	overlay.id = OVERLAY_ID;
	overlay.className = "domain-warning-overlay";
	overlay.innerHTML = `
		<div class="domain-warning-modal">
			<div class="domain-warning-icon">⚠️</div>
			<div class="domain-warning-title">${config.warningTitle ?? "域名安全提醒"}</div>
			<div class="domain-warning-text">
				<div>${config.warningMessage ?? "您正在访问非官方网站，可能存在安全风险。"}</div>
				<div class="domain-warning-host">${window.location.hostname}</div>
			</div>
			<div class="domain-warning-actions">
				<button type="button" class="domain-warning-btn domain-warning-btn-go">前往官网</button>
				<button type="button" class="domain-warning-btn domain-warning-btn-stay">继续访问</button>
			</div>
		</div>
	`;

	const dismiss = () => {
		sessionStorage.setItem(SESSION_KEY, "1");
		overlay.remove();
		style.remove();
	};

	overlay
		.querySelector(".domain-warning-btn-go")
		?.addEventListener("click", () => {
			const official = sites[0];
			if (official) {
				const target = new URL(official.url);
				target.pathname = window.location.pathname;
				target.search = window.location.search;
				window.location.replace(target.href);
			}
		});
	overlay
		.querySelector(".domain-warning-btn-stay")
		?.addEventListener("click", dismiss);

	document.head.appendChild(style);
	document.body.appendChild(overlay);
}

export function initDomainWarning(config: AntiLeechConfig): void {
	if (!config.enable) return;
	if (sessionStorage.getItem(SESSION_KEY)) return;

	const hostname = window.location.hostname;
	const sites = normalizeSites(config.officialSites);
	const isOfficial = sites.some((site) => {
		const officialHost = new URL(site.url).hostname;
		return hostname === officialHost || hostname.endsWith(`.${officialHost}`);
	});

	if (isOfficial || isLocalOrPreview(hostname) || sites.length === 0) {
		sessionStorage.setItem(SESSION_KEY, "1");
		return;
	}

	if (config.debug) {
		console.log("[domain-warning] non-official host:", hostname);
	}

	setTimeout(() => showWarning(config, sites), 1200);
}
