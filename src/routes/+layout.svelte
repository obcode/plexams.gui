<script>
	// Die gemeinsame Hülle für Planungsoberfläche und Portal: CSS, Theme, Titel.
	// Navigation und Zustands-Polling gehören nur der Planung und liegen in
	// (planner)/+layout.svelte; das Portal hat ein eigenes, schlankes Layout.
	import '../app.css';
	import { themeChange } from 'theme-change';
	import { onMount } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	onMount(() => {
		themeChange(false);
	});
</script>

<svelte:head><title>Plexams</title></svelte:head>

{@render children?.()}
