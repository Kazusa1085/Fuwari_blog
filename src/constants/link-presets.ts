import { LinkPreset, type NavBarLink } from "@/types/config";

export const LinkPresets: { [key in LinkPreset]: NavBarLink } = {
	[LinkPreset.Home]: {
		name: "首页",
		url: "/",
	},
	[LinkPreset.Archive]: {
		name: "归档",
		url: "/archive/",
	},
	[LinkPreset.Friends]: {
		name: "友链",
		url: "/friends/",
	},
	[LinkPreset.Apps]: {
		name: "应用",
		url: "/apps/",
	},
	[LinkPreset.Donate]: {
		name: "赞助",
		url: "/donate/",
	},
	[LinkPreset.Stats]: {
		name: "统计",
		url: "https://umami.micostar.cc/share/X9ZZZ5l2xErS44Rc",
		external: true,
	},
	[LinkPreset.Status]: {
		name: "状态",
		url: "https://uptime.micostar.cc/status/default",
		external: true,
	},
	[LinkPreset.Monitor]: {
		name: "流量监控",
		url: "https://eo.micostar.cc",
		external: true,
	},
};
