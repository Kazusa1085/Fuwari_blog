import type { Song } from "./types";

export const STORAGE_KEY_VOLUME = "music-player-volume";

export const DEFAULT_VOLUME = 0.7;

export const SKIP_ERROR_DELAY = 1000;

export const ERROR_DISPLAY_DURATION = 3000;

// Meting API 的默认值，仅在 content/music/config.json 里对应字段缺失时使用
export const DEFAULT_METING_API =
	"https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
export const DEFAULT_METING_ID = "14164869977";
export const DEFAULT_METING_SERVER = "netease";
export const DEFAULT_METING_TYPE = "playlist";

export const DEFAULT_SONG: Song = {
	title: "Sample Song",
	artist: "Sample Artist",
	cover: "/favicon/icon.png",
	url: "",
	duration: 0,
	id: 0,
};
