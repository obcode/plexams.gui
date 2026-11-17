<script>
	// Fehlerkarte für Planungsoberfläche und Portal. Jeder Bereich hat eine eigene
	// +error.svelte, damit ein Fehler im eigenen Layout erscheint (mit bzw. ohne
	// Navigation) und „Zur Startseite" an die richtige Startseite führt.
	import { page } from '$app/state';

	/**
	 * @typedef {Object} Props
	 * @property {string} [homeHref] Ziel von „Zur Startseite"
	 */

	/** @type {Props} */
	let { homeHref = '/' } = $props();

	// Die 404 ist der häufigste Fall und kein Vorfall — sie bekommt einen
	// eigenen, ruhigen Text statt der Fehlermeldung.
	const notFound = $derived(page.status === 404);
	const eventId = $derived(page.error?.eventId);
</script>

<svelte:head>
	<title>{notFound ? 'Seite nicht gefunden' : 'Fehler'} · Plexams</title>
</svelte:head>

<div class="flex justify-center py-12">
	<div class="card bg-base-100 w-full max-w-xl shadow-sm">
		<div class="card-body items-center text-center">
			<div class="text-5xl" aria-hidden="true">{notFound ? '🧭' : '⚠️'}</div>

			{#if notFound}
				<h1 class="card-title text-2xl">Seite nicht gefunden</h1>
				<p class="text-base-content/70">
					Die Adresse <span class="font-mono">{page.url.pathname}</span> gibt es nicht (mehr).
				</p>
			{:else}
				<h1 class="card-title text-2xl">Da ist etwas schiefgegangen</h1>
				<p class="text-base-content/70">
					{page.error?.message ?? 'Unerwarteter Fehler.'}
				</p>
			{/if}

			{#if eventId}
				<!-- Die Referenz, mit der aus einem Screenshot eine auffindbare
				     Meldung wird: die Prüfungsplanung findet den Bericht darüber
				     wieder. -->
				<div class="mt-2 text-sm">
					<span class="text-base-content/60">Referenz:</span>
					<span class="font-mono select-all">{eventId}</span>
				</div>
			{/if}

			<div class="card-actions mt-4">
				<a class="btn btn-primary" href={homeHref}>Zur Startseite</a>
				{#if !notFound}
					<button class="btn btn-ghost" onclick={() => location.reload()}>Neu laden</button>
				{/if}
			</div>
		</div>
	</div>
</div>
