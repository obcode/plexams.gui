<!--
	Nutzer-Markdown (Todo-Beschreibungen, Kommentare) sicher anzeigen.

	Gerendert wird erst im Browser: der Sanitizer braucht ein DOM (siehe
	$lib/markdown.js). Im SSR und bis zum Hydrieren steht der Rohtext da — escaped,
	mit erhaltenen Zeilenumbrüchen. So gibt es nie ein ungefiltertes {@html}.
-->
<script>
	import { renderMarkdown } from '$lib/markdown.js';

	/** @type {{ src: string | null | undefined, class?: string }} */
	let { src, class: cls = '' } = $props();

	// Bewusst $state + $effect statt $derived: der Effekt läuft erst NACH dem
	// Hydrieren. Ein $derived lieferte im Browser schon beim Hydrieren HTML, der
	// Server aber Rohtext — ein Hydration-Mismatch.
	/** @type {string | null} */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let html = $state(null);

	$effect(() => {
		html = renderMarkdown(src);
	});
</script>

{#if html !== null}
	<div class="prose prose-sm max-w-none {cls}">{@html html}</div>
{:else}
	<div class="whitespace-pre-wrap text-sm {cls}">{src ?? ''}</div>
{/if}
