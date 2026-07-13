export interface Song {
	id: number;
	title: string;
	artist: string;
	cover: string;
	url: string;
	duration: number;
}

export type PlayerMode = "local" | "meting";

export type RepeatMode = 0 | 1 | 2;

export interface MusicPlayerState {
	currentSong: Song;
	playlist: Song[];
	currentIndex: number;
	isPlaying: boolean;
	isLoading: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isMuted: boolean;
	isShuffled: boolean;
	isRepeating: RepeatMode;
	showPlaylist: boolean;
	errorMessage: string;
	showError: boolean;
}

// 音乐播放器的配置，来自独立仓库 content/music/config.json
// （见 scripts/sync-content.js，与 friends/projects 走同一套内容分离机制）
// 该仓库如果没有这个文件，播放器整体不渲染（默认禁用）
export interface MusicPlayerConfig {
	enable?: boolean; // 文件存在时默认视为 true，可显式设为 false 临时关闭而不用删文件
	mode: PlayerMode;
	// mode: "meting" 时使用
	meting_api?: string;
	id?: string;
	server?: string;
	type?: string;
	// mode: "local" 时使用，不提供则播放列表为空
	localPlaylist?: Song[];
}

export interface SidebarMusicWidgetProps {
	class?: string;
	style?: string;
}
