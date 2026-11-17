<script>
	// Das schlanke Layout des Portals für Prüfende: kein Planungsmenü, kein
	// Zustands-Polling. Wer auch eine Rolle in der Planung hat, findet hier den
	// Weg zurück.
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 * @property {any} data
	 */

	/** @type {Props} */
	let { children, data } = $props();
	const session = $derived(data.session);
</script>

<svelte:head><title>Portal · Plexams</title></svelte:head>

<header class="border-b border-base-300 bg-base-100">
	<div
		class="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-3 py-3 sm:px-4"
	>
		<a href="/portal" class="text-lg font-semibold">Prüfungsplanung · Portal</a>
		<span class="grow"></span>
		<span class="text-sm text-base-content/70">{session?.name || session?.email}</span>
		{#if session?.isStaff}
			<a href="/" class="btn btn-ghost btn-sm">Zur Prüfungsplanung</a>
		{/if}
	</div>
</header>

<main class="mx-auto w-full max-w-3xl px-3 pt-6 pb-12 sm:px-4">
	{@render children?.()}
</main>
