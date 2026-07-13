<script lang="ts">
import { onDestroy, onMount } from "svelte";

import { musicPlayerStore } from "./store";
import type { MusicPlayerConfig, MusicPlayerState } from "./types";

import SidebarControls from "./components/SidebarControls.svelte";
import SidebarCover from "./components/SidebarCover.svelte";
import SidebarPlaylist from "./components/SidebarPlaylist.svelte";
import SidebarProgress from "./components/SidebarProgress.svelte";
import SidebarTrackInfo from "./components/SidebarTrackInfo.svelte";

interface Props {
	config: MusicPlayerConfig;
}

const { config }: Props = $props();

let state: MusicPlayerState = $state(musicPlayerStore.getState());

let unsubscribe: (() => void) | undefined;

onMount(() => {
	unsubscribe = musicPlayerStore.subscribe((next) => {
		state = next;
	});
	// 卡片自己负责初始化 store（不再依赖 Mizuki 原本悬浮播放器组件的
	// initialize() 调用），config 来自 MusicSidebarWidget.astro 在构建时
	// 读取 content/music/config.json 后传入的 props
	musicPlayerStore.initialize(config);
});

onDestroy(() => {
	unsubscribe?.();
});
</script>

<div class="music-sidebar-card">
	<div class="top-row">
		<SidebarCover
			currentSong={state.currentSong}
			isPlaying={state.isPlaying}
			isLoading={state.isLoading}
		/>
		<SidebarTrackInfo
			currentSong={state.currentSong}
			currentTime={state.currentTime}
			duration={state.duration}
			volume={state.volume}
			isMuted={state.isMuted}
			onToggleMute={() => musicPlayerStore.toggleMute()}
			onSetVolume={(v) => musicPlayerStore.setVolume(v)}
		/>
	</div>

	<SidebarProgress
		currentTime={state.currentTime}
		duration={state.duration}
		onSeek={(t) => musicPlayerStore.seek(t)}
	/>

	<SidebarControls
		isPlaying={state.isPlaying}
		isShuffled={state.isShuffled}
		repeatMode={state.isRepeating}
		onToggleMode={() => musicPlayerStore.toggleMode()}
		onPrev={() => musicPlayerStore.prev()}
		onNext={() => musicPlayerStore.next()}
		onTogglePlay={() => musicPlayerStore.toggle()}
		onTogglePlaylist={() => musicPlayerStore.togglePlaylist()}
	/>

	<SidebarPlaylist
		playlist={state.playlist}
		currentIndex={state.currentIndex}
		isPlaying={state.isPlaying}
		show={state.showPlaylist}
		onClose={() => musicPlayerStore.togglePlaylist()}
		onPlaySong={(index) => musicPlayerStore.playIndex(index)}
	/>
</div>

<style>
	.music-sidebar-card {
		width: 100%;
	}

	.top-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}
</style>
