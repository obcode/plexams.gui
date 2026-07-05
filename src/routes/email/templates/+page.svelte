<!--
	E-Mail-Vorlagen: Übersicht + Editor. Das Backend rendert jede E-Mail aus genau
	einem Markdown-Go-Template; hier lassen sich diese Texte (Override über den
	eingebauten Defaults) ohne Go-Wissen anpassen. Auswahl öffnet den Editor
	(EmailTemplateEditor) im selben Screen — die Liste liefert die SSR-Load, das
	Umschalten braucht keinen erneuten Fetch.
-->
<script>
	import EmailTemplateEditor from '$lib/email/EmailTemplateEditor.svelte';

	let { data } = $props();

	// lokale Kopie, damit Speichern/Zurücksetzen die Liste sofort aktualisiert
	let templates = $state(data.templates);
	/** @type {string | null} */
	let selectedName = $state(null);
	let q = $state('');

	let selected = $derived(templates.find((/** @type {any} */ t) => t.name === selectedName));
	let customCount = $derived(templates.filter((/** @type {any} */ t) => !t.isDefault).length);

	let filtered = $derived(
		q.trim()
			? templates.filter((/** @type {any} */ t) => {
					const s = q.trim().toLowerCase();
					return (
						(t.description ?? '').toLowerCase().includes(s) ||
						(t.name ?? '').toLowerCase().includes(s)
					);
				})
			: templates
	);

	/** @param {any} updated  Rückgabe von setEmailTemplate bzw. reset-Ersatzobjekt */
	function onsaved(updated) {
		templates = templates.map((/** @type {any} */ t) =>
			t.name === updated.name ? { ...t, ...updated } : t
		);
	}
</script>

{#if selected}
	<div class="mx-2 mt-4">
		<EmailTemplateEditor
			template={selected}
			functions={data.functions}
			{onsaved}
			onback={() => (selectedName = null)}
		/>
	</div>
{:else}
	<div class="mx-2 mt-4 flex flex-col gap-4">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-semibold">E-Mail-Vorlagen</h1>
			<span class="badge badge-primary badge-lg tabular-nums">{templates.length}</span>
			{#if customCount}
				<span class="badge badge-warning badge-sm tabular-nums">{customCount} angepasst</span>
			{/if}
			<div class="flex-1"></div>
			<input
				type="search"
				placeholder="suchen …"
				class="input input-bordered input-sm w-56"
				bind:value={q}
			/>
		</div>

		<p class="max-w-3xl text-sm text-base-content/60">
			Jede E-Mail wird aus einer Markdown-Vorlage erzeugt. Hier lassen sich die Texte anpassen;
			Platzhalter in doppelten geschweiften Klammern <span class="font-mono">{'{{ … }}'}</span>
			werden beim Versand durch echte Werte ersetzt. Die Vorschau im Editor nutzt Beispieldaten.
		</p>

		{#if filtered.length === 0}
			<div class="text-sm text-base-content/50">Keine Vorlage passt zur Suche.</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each filtered as t (t.name)}
					<button
						type="button"
						class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/50 hover:bg-base-200/40"
						onclick={() => (selectedName = t.name)}
					>
						<div class="flex items-start gap-2">
							<span class="flex-1 font-medium">{t.description || t.name}</span>
							{#if t.isDefault}
								<span class="badge badge-ghost badge-sm shrink-0">Standard</span>
							{:else}
								<span class="badge badge-warning badge-sm shrink-0">angepasst</span>
							{/if}
						</div>
						<span class="font-mono text-xs text-base-content/50">{t.name}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
