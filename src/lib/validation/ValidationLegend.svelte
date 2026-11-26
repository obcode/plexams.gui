<script>
	// The explanation every validation page shares: what a run does and how to read
	// the three levels. The page adds, as children, what its own checks are about.

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children] what this page's checks cover
	 */

	/** @type {Props} */
	let { children } = $props();
</script>

<div class="flex max-w-3xl flex-col gap-1 text-sm text-base-content/70">
	<p>
		{#if children}{@render children()}{/if}
		Die Validierung liest nur und ändert nichts; während sie läuft, sind Änderungen kurz gesperrt.
	</p>
	<p>
		<span class="whitespace-nowrap">
			⛔ <span class="font-medium">Fehler</span> müssen behoben werden,
		</span>
		<span class="whitespace-nowrap">
			⚠️ <span class="font-medium">Warnungen</span> ansehen und entscheiden,
		</span>
		<span class="whitespace-nowrap">
			• <span class="font-medium">Infos</span> nur zur Kenntnis.
		</span>
		„Übersprungen" heißt: Die Daten für diese Prüfung gibt es noch nicht.
		<a class="link link-hover whitespace-nowrap text-base-content/50" href="/hilfe#validierung">
			Mehr dazu in der Hilfe →
		</a>
	</p>
</div>
