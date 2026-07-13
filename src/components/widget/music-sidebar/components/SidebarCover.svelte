<script lang="ts">
import type { Song } from "../types";
import CoverImage from "./CoverImage.svelte";

interface Props {
	currentSong: Song;
	isPlaying: boolean;
	isLoading: boolean;
}

const { currentSong, isPlaying, isLoading }: Props = $props();
</script>

<CoverImage
	cover={currentSong.cover}
	{isPlaying}
	{isLoading}
	size="expanded"
	interactive={false}
/>
