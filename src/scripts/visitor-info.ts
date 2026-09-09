export function initVisitorInfo(): void {
	const init = () => {
		// 猜猜我在哪上学
		const BLOGGER_LAT = 48.15;
		const BLOGGER_LON = 11.5696;

		// CDN 资源路径
		const CDN_IMG_CF = "/cdn/cloudflare.svg";
		const CDN_IMG_EO = "/cdn/edgeone.png";
		const CDN_IMG_VERCEL = "/cdn/vercel.png";

		const checkCDN = async () => {
			const imgEl = document.getElementById("cdn-node") as HTMLImageElement;
			if (!imgEl) return;

			// 本地开发环境检测
			const isLocalhost =
				window.location.hostname === "localhost" ||
				window.location.hostname === "127.0.0.1";
			if (isLocalhost) {
				// 本地开发时，用文字替代图片
				const textSpan = document.createElement("span");
				textSpan.textContent = "本地开发";
				textSpan.className = "info-value";
				textSpan.style.marginLeft = "4px";
				imgEl.replaceWith(textSpan);
				return;
			}

			try {
				// 发送 HEAD 请求检测响应头
				const response = await fetch(window.location.href, { method: "HEAD" });

				// Cloudflare 官方认证的标识符
				const cfRay = response.headers.get("cf-ray");
				const cfCacheStatus = response.headers.get("cf-cache-status");

				// EdgeOne 官方认证的标识符
				const eoLogUuid = response.headers.get("eo-log-uuid");
				const eoCacheStatus = response.headers.get("eo-cache-status");

				// Vercel 官方认证的标识符
				const vercelId = response.headers.get("x-vercel-id");
				const vercelCache = response.headers.get("x-vercel-cache");

				if (cfRay || cfCacheStatus) {
					imgEl.src = CDN_IMG_CF;
					imgEl.alt = "Cloudflare";
				} else if (eoLogUuid || eoCacheStatus) {
					imgEl.src = CDN_IMG_EO;
					imgEl.alt = "EdgeOne";
				} else if (vercelId || vercelCache) {
					imgEl.src = CDN_IMG_VERCEL;
					imgEl.alt = "Vercel";
					imgEl.style.height = "14px";
					imgEl.style.width = "auto";
				} else {
					imgEl.style.display = "none";
					imgEl.alt = "Unknown CDN";
				}
			} catch (e) {
				console.error("CDN detection failed:", e);
				imgEl.style.display = "none";
			}
		};

		const calculateDistance = (
			lat1: number,
			lon1: number,
			lat2: number,
			lon2: number,
		) => {
			const R = 6371;
			const dLat = ((lat2 - lat1) * Math.PI) / 180;
			const dLon = ((lon2 - lon1) * Math.PI) / 180;
			const a =
				0.5 -
				Math.cos(dLat) / 2 +
				(Math.cos((lat1 * Math.PI) / 180) *
					Math.cos((lat2 * Math.PI) / 180) *
					(1 - Math.cos(dLon))) /
					2;
			return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
		};

		const getOS = () => {
			const ua = navigator.userAgent;
			if (ua.includes("Win")) return "Windows";
			if (ua.includes("Mac")) return "MacOS";
			if (ua.includes("Linux")) return "Linux";
			if (ua.includes("Android")) return "Android";
			if (ua.includes("like Mac")) return "iOS";
			return "Unknown";
		};

		const getBrowser = () => {
			const ua = navigator.userAgent;
			if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
			if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
			if (ua.includes("Firefox")) return "Firefox";
			if (ua.includes("Edg")) return "Edge";
			return "Unknown";
		};

		const setInfo = (id: string, text: string) => {
			const el = document.getElementById(id);
			if (el) el.textContent = text;
		};

		const setAllToFailure = () => {
			setInfo("ip-address", "获取失败");
			setInfo("location", "获取失败");
			setInfo("isp", "获取失败");
			setInfo("distance", "获取失败");
		};

		interface ParsedData {
			ip?: string;
			location?: string;
			isp?: string;
			lat?: number;
			lon?: number;
		}

		interface ApiEndpoint {
			name: string;
			url: string;
			parser: (data: any) => ParsedData | null;
		}

		const apiEndpoints: ApiEndpoint[] = [
			{
				name: "ip.sb",
				url: "https://api.ip.sb/geoip",
				parser: (data: any) => ({
					ip: data.ip,
					location: `${data.country || ""}, ${data.city || ""}`,
					isp: data.organization,
					lat: data.latitude,
					lon: data.longitude,
				}),
			},
			{
				name: "ipinfo.io",
				url: "https://ipinfo.io/json",
				parser: (data: any) => {
					const [lat, lon] = data.loc ? data.loc.split(",") : [null, null];
					return {
						ip: data.ip,
						location: `${data.country || ""}, ${data.city || ""}`,
						isp: data.org,
						lat: parseFloat(lat),
						lon: parseFloat(lon),
					};
				},
			},
			{
				name: "api.vore.top",
				url: "https://api.vore.top/api/IPdata",
				parser: (data: any) => {
					if (data.code !== 200 || !data.ipinfo) return null;
					return {
						ip: data.ipinfo.ip,
						location:
							`${data.ipinfo.info.country || ""}, ${data.ipinfo.info.province || ""}, ${data.ipinfo.info.city || ""}`.replace(
								/, $/,
								"",
							),
						isp: data.ipinfo.info.isp,
						lat: data.ipinfo.adcode?.lat,
						lon: data.ipinfo.adcode?.lng,
					};
				},
			},
			{
				name: "ipwho.is",
				url: "https://ipwho.is/",
				parser: (data: any) => {
					if (!data.success) return null;
					return {
						ip: data.ip,
						location: `${data.country || ""}, ${data.city || ""}`,
						isp: data.isp,
						lat: data.latitude,
						lon: data.longitude,
					};
				},
			},
			{
				name: "freegeoip.app",
				url: "https://freegeoip.app/json/",
				parser: (data: any) => ({
					ip: data.ip,
					location: `${data.country_name || ""}, ${data.city || ""}`,
					isp: "",
					lat: data.latitude,
					lon: data.longitude,
				}),
			},
			{
				name: "ipapi.co",
				url: "https://ipapi.co/json/",
				parser: (data: any) => ({
					ip: data.ip,
					location: `${data.country_name || ""}, ${data.city || ""}`,
					isp: data.org,
					lat: data.latitude,
					lon: data.longitude,
				}),
			},
			{
				name: "vvhan.com",
				url: "https://api.vvhan.com/api/ipInfo?type=json",
				parser: (data: any) =>
					data.success
						? {
								ip: data.ip,
								location: `${data.info.country || ""}, ${data.info.city || ""}`,
								isp: data.info.isp,
							}
						: null,
			},
			{
				name: "ip-api.com",
				url: "https://ip-api.com/json",
				parser: (data: any) =>
					data.status === "success"
						? {
								ip: data.query,
								location: `${data.country || ""}, ${data.city || ""}`,
								isp: data.isp,
								lat: data.lat,
								lon: data.lon,
							}
						: null,
			},
		];

		const fetchIpInfo = async () => {
			setInfo("os", getOS());
			setInfo("browser", getBrowser());
			// 启动 CDN 检测
			checkCDN();

			let finalData: ParsedData = {};

			for (const api of apiEndpoints) {
				if (finalData.lat && finalData.lon) break;

				try {
					const response = await fetch(api.url);
					if (!response.ok) throw new Error(`Response not OK for ${api.name}`);
					const data = await response.json();
					const parsed = api.parser(data);
					if (parsed) {
						finalData = { ...finalData, ...parsed };
					}
				} catch {
					// 静默处理，继续尝试下一个 API
				}
			}

			if (finalData.ip && !finalData.lat) {
				console.log(
					`Have IP (${finalData.ip}) but no coordinates. Trying final lookup.`,
				);
				try {
					const response = await fetch(
						`https://ip-api.com/json/${finalData.ip}`,
					);
					if (!response.ok) throw new Error("Final lookup failed");
					const data = await response.json();
					if (data.status === "success") {
						finalData.lat = data.lat;
						finalData.lon = data.lon;
					}
				} catch {
					// 静默处理
				}
			}

			if (finalData.ip) {
				setInfo("ip-address", finalData.ip);
				setInfo("location", finalData.location || "N/A");
				setInfo("isp", finalData.isp || "N/A");

				if (finalData.lat && finalData.lon) {
					const dist = calculateDistance(
						BLOGGER_LAT,
						BLOGGER_LON,
						finalData.lat,
						finalData.lon,
					);
					setInfo("distance", `约 ${dist} 公里`);
				} else {
					setInfo("distance", "无法计算");
				}
			} else {
				setAllToFailure();
			}
		};

		fetchIpInfo();

		// IP 信息卡片切换显示
		const setupPurityCheck = () => {
			const btn = document.getElementById(
				"ip-purity-btn",
			) as HTMLButtonElement | null;
			const resultDiv = document.getElementById("ip-purity-result");
			const cardImg = document.getElementById(
				"ippure-card-img",
			) as HTMLImageElement | null;
			if (!btn || !resultDiv || !cardImg) return;

			const baseSrc = cardImg.dataset.src || "https://my.ippure.com/v1/card";
			let isExpanded = false;

			// 图片加载完成事件
			cardImg.addEventListener("load", () => {
				btn.classList.remove("loading");
				const btnSpan = btn.querySelector("span");
				if (btnSpan && isExpanded) btnSpan.textContent = "收起 IP 信息卡";
			});

			// 图片加载失败事件
			cardImg.addEventListener("error", () => {
				btn.classList.remove("loading");
				const btnSpan = btn.querySelector("span");
				if (btnSpan) btnSpan.textContent = "加载失败，点击重试";
				isExpanded = false;
				resultDiv.classList.add("hidden");
				btn.classList.remove("expanded");
			});

			btn.addEventListener("click", () => {
				if (btn.classList.contains("loading")) return; // 加载中禁止点击

				isExpanded = !isExpanded;

				if (isExpanded) {
					// 显示加载状态
					btn.classList.add("loading");
					const btnSpan = btn.querySelector("span");
					if (btnSpan) btnSpan.textContent = "查询中...";

					// 每次展开时加载新图片（添加时间戳防止缓存）
					cardImg.src = `${baseSrc}?t=${Date.now()}`;
					resultDiv.classList.remove("hidden");
					btn.classList.add("expanded");
				} else {
					resultDiv.classList.add("hidden");
					btn.classList.remove("expanded");
					const btnSpan = btn.querySelector("span");
					if (btnSpan) btnSpan.textContent = "查看 IP 信息卡";
				}
			});
		};

		setupPurityCheck();
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
}
