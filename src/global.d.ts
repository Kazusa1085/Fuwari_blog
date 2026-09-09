import type { AstroIntegration } from "@swup/astro";
import type {
	clearUmamiShareCache,
	getUmamiShareData,
	getUmamiStats,
} from "@/scripts/umami-client";

declare global {
	interface Window {
		// type from '@swup/astro' is incorrect
		swup: AstroIntegration;
		getUmamiShareData: typeof getUmamiShareData;
		clearUmamiShareCache: typeof clearUmamiShareCache;
		getUmamiStats: typeof getUmamiStats;
	}
}
