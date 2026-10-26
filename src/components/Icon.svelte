<script lang="ts">
// Local icon renderer: replaces the runtime @iconify/svelte fetch with a small
// inlined subset of the icons actually used by Svelte islands.
interface IconData {
	body: string;
	width: number;
	height: number;
}

const icons: Record<string, IconData> = {
	"material-symbols:search": {
		body: '<path fill="currentColor" d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"/>',
		width: 24,
		height: 24,
	},
	"fa6-solid:chevron-right": {
		body: '<path fill="currentColor" d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256L73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/>',
		width: 320,
		height: 512,
	},
	"fa6-solid:arrow-rotate-left": {
		body: '<path fill="currentColor" d="M125.7 160H176c17.7 0 32 14.3 32 32s-14.3 32-32 32H48c-17.7 0-32-14.3-32-32V64c0-17.7 14.3-32 32-32s32 14.3 32 32v51.2l17.6-17.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0z"/>',
		width: 512,
		height: 512,
	},
	"eos-icons:loading": {
		body: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="40 16"></circle>',
		width: 24,
		height: 24,
	},
	"material-symbols:music-note": {
		body: '<path fill="currentColor" d="M7.175 19.825Q6 18.65 6 17t1.175-2.825T10 13q.575 0 1.063.138t.937.412V3h6v4h-4v10q0 1.65-1.175 2.825T10 21t-2.825-1.175"/>',
		width: 24,
		height: 24,
	},
	"material-symbols:pause": {
		body: '<path fill="currentColor" d="M14 19V5h4v14zm-8 0V5h4v14z"/>',
		width: 24,
		height: 24,
	},
	"material-symbols:play-arrow": {
		body: '<path fill="currentColor" d="M8 19V5l11 7z"/>',
		width: 24,
		height: 24,
	},
	"material-symbols:skip-next": {
		body: '<path fill="currentColor" d="M16.5 18V6h2v12zm-11 0V6l9 6z"/>',
		width: 24,
		height: 24,
	},
	"material-symbols:skip-previous": {
		body: '<path fill="currentColor" d="M5.5 18V6h2v12zm13 0l-9-6l9-6z"/>',
		width: 24,
		height: 24,
	},
	"material-symbols:queue-music-rounded": {
		body: '<path fill="currentColor" d="M16 20q-1.25 0-2.125-.875T13 17t.875-2.125T16 14q.275 0 .525.038T17 14.2V7q0-.425.288-.712T18 6h3q.425 0 .713.288T22 7t-.288.713T21 8h-2v9q0 1.25-.875 2.125T16 20M4 16q-.425 0-.712-.288T3 15t.288-.712T4 14h6q.425 0 .713.288T11 15t-.288.713T10 16zm0-4q-.425 0-.712-.288T3 11t.288-.712T4 10h10q.425 0 .713.288T15 11t-.288.713T14 12zm0-4q-.425 0-.712-.288T3 7t.288-.712T4 6h10q.425 0 .713.288T15 7t-.288.713T14 8z"/>',
		width: 24,
		height: 24,
	},
	"material-symbols:graphic-eq-rounded": {
		body: '<path fill="currentColor" d="M7 17V7q0-.425.288-.712T8 6t.713.288T9 7v10q0 .425-.288.713T8 18t-.712-.288T7 17m4 4V3q0-.425.288-.712T12 2t.713.288T13 3v18q0 .425-.288.713T12 22t-.712-.288T11 21m-8-8v-2q0-.425.288-.712T4 10t.713.288T5 11v2q0 .425-.288.713T4 14t-.712-.288T3 13m12 4V7q0-.425.288-.712T16 6t.713.288T17 7v10q0 .425-.288.713T16 18t-.712-.288T15 17m4-4v-2q0-.425.288-.712T20 10t.713.288T21 11v2q0 .425-.288.713T20 14t-.712-.288T19 13"/>',
		width: 24,
		height: 24,
	},
};

let { icon = "", ...rest } = $props<
	Record<string, unknown> & { icon?: string }
>();
const data = icons[String(icon)];
const width = data?.width ?? 24;
const height = data?.height ?? 24;
</script>

<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" {...rest}>
	{@html data?.body ?? ""}
</svg>
