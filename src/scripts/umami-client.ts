export interface UmamiShareConfig {
	enable: boolean;
	baseUrl: string;
	shareId?: string;
	timezone: string;
}

export interface UmamiStats {
	pageviews?: number;
	visits?: number;
	visitors?: number;
	[key: string]: unknown;
}

interface UmamiShareData {
	websiteId: string;
	token: string;
}

const SHARE_CACHE_KEY = "umami-share-cache";
const SHARE_CACHE_TTL = 3600_000; // 1h

let sharePromise: Promise<UmamiShareData> | null = null;

async function fetchShareData(
	baseUrl: string,
	shareId: string,
): Promise<UmamiShareData> {
	const cached = localStorage.getItem(SHARE_CACHE_KEY);
	if (cached) {
		try {
			const parsed = JSON.parse(cached) as {
				timestamp: number;
				value: UmamiShareData;
			};
			if (Date.now() - parsed.timestamp < SHARE_CACHE_TTL) {
				return parsed.value;
			}
		} catch {
			localStorage.removeItem(SHARE_CACHE_KEY);
		}
	}

	const shareUrl = `${baseUrl}/api/share/${shareId}`;
	const res = await fetch(shareUrl);
	if (!res.ok) {
		throw new Error(`获取 Umami 分享信息失败: ${res.status} ${res.statusText}`);
	}

	const data = (await res.json()) as UmamiShareData;
	localStorage.setItem(
		SHARE_CACHE_KEY,
		JSON.stringify({ timestamp: Date.now(), value: data }),
	);
	return data;
}

export function getUmamiShareData(
	baseUrl: string,
	shareId?: string,
): Promise<UmamiShareData> {
	if (!shareId) {
		return Promise.reject(new Error("Umami shareId is not configured"));
	}
	if (!sharePromise) {
		sharePromise = fetchShareData(baseUrl, shareId).catch((error) => {
			sharePromise = null;
			throw error;
		});
	}
	return sharePromise;
}

export function clearUmamiShareCache(): void {
	localStorage.removeItem(SHARE_CACHE_KEY);
	sharePromise = null;
}

export async function getUmamiStats(
	config: UmamiShareConfig,
	options: { path?: string; retry?: boolean } = {},
): Promise<UmamiStats | null> {
	if (!config.enable) return null;

	const { websiteId, token } = await getUmamiShareData(
		config.baseUrl,
		config.shareId,
	);

	const params = new URLSearchParams({
		startAt: "0",
		endAt: String(Date.now()),
		unit: "hour",
		timezone: config.timezone,
	});
	if (options.path) {
		params.set("path", `eq.${options.path}`);
	}

	const statsUrl = `${config.baseUrl}/api/websites/${websiteId}/stats?${params.toString()}`;
	const res = await fetch(statsUrl, {
		headers: {
			"x-umami-share-token": token,
			"x-umami-share-context": "true",
		},
	});

	if (res.status === 401 && options.retry !== false) {
		clearUmamiShareCache();
		return getUmamiStats(config, { ...options, retry: false });
	}

	if (!res.ok) {
		throw new Error(`获取 Umami 统计数据失败: ${res.status}`);
	}

	return (await res.json()) as UmamiStats;
}

export function exposeUmamiGlobals(): void {
	window.getUmamiShareData = getUmamiShareData;
	window.clearUmamiShareCache = clearUmamiShareCache;
	window.getUmamiStats = getUmamiStats;
}
