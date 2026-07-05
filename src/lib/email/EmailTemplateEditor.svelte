<!--
	Editor für EIN E-Mail-Template. Zweispaltig: links Markdown-Editor +
	Variablen-/Funktions-Referenz, rechts Live-Vorschau (sandboxed iframe) gegen
	Beispieldaten aus dem Backend. Speichern/Zurücksetzen laufen über die
	/api/email-Proxys; der Diff ist rein clientseitig (templateDiff.js).

	Wird pro Auswahl frisch gemountet (Parent nutzt {#key template.name}), daher
	initialisiert der Editor-Puffer einmalig aus template.markdown.
-->
<script>
	import { tick } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';
	import { lineDiff, diffStat } from '$lib/email/templateDiff';

	/**
	 * @typedef {Object} Variable
	 * @property {string} name  z.B. "{{ .Exam.Ancode }}"
	 * @property {string} description
	 * @property {string} example
	 *
	 * @typedef {Object} Template
	 * @property {string} name  Dateiname, stabile ID
	 * @property {string} description
	 * @property {string} markdown  aktuell wirksamer Text
	 * @property {boolean} isDefault
	 * @property {string} defaultMarkdown
	 * @property {Variable[]} variables
	 *
	 * @typedef {Object} Props
	 * @property {Template} template
	 * @property {{ name: string, usage: string, description: string }[]} functions
	 * @property {(t: Template) => void} onsaved  Parent aktualisiert seine Liste
	 * @property {() => void} onback
	 */

	/** @type {Props} */
	let { template, functions = [], onsaved, onback } = $props();

	// Editor-Puffer (einmalig aus dem wirksamen Stand); template.markdown ist der
	// „gespeicherte" Vergleichsstand und wird nach dem Speichern vom Parent
	// aktualisiert → dirty wird dadurch wieder false.
	let buffer = $state(template.markdown);
	let dirty = $derived(buffer !== template.markdown);
	let changedVsDefault = $derived(buffer !== template.defaultMarkdown);

	/** @type {HTMLTextAreaElement | undefined} */
	let taEl = $state();

	let view = $state(/** @type {'edit' | 'diff'} */ ('edit'));
	let previewMode = $state(/** @type {'html' | 'text'} */ ('html'));
	let showFunctions = $state(false);

	// --- Live-Vorschau (debounced) --------------------------------------------
	/** @type {{ html: string, text: string, error: string | null }} */
	let preview = $state({ html: '', text: '', error: null });
	let previewLoading = $state(false);
	let seq = 0; // gegen out-of-order-Antworten
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	/** @param {string} md */
	async function runPreview(md) {
		const mySeq = ++seq;
		previewLoading = true;
		try {
			const res = await fetch('/api/email/renderEmailTemplatePreview', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: template.name, markdown: md })
			});
			const d = await res.json().catch(() => ({}));
			if (mySeq !== seq) return; // eine neuere Anfrage ist schon unterwegs
			if (!res.ok || d?.error) {
				preview = { html: '', text: '', error: d?.error || `Fehler (HTTP ${res.status})` };
			} else {
				const p = d.renderEmailTemplatePreview ?? {};
				preview = { html: p.html ?? '', text: p.text ?? '', error: p.error ?? null };
			}
		} catch (e) {
			if (mySeq === seq) {
				preview = { html: '', text: '', error: e instanceof Error ? e.message : String(e) };
			}
		} finally {
			if (mySeq === seq) previewLoading = false;
		}
	}

	$effect(() => {
		const md = buffer; // Abhängigkeit: bei jeder Änderung neu planen
		clearTimeout(timer);
		timer = setTimeout(() => runPreview(md), 400);
		return () => clearTimeout(timer);
	});

	// --- Variable/Funktion an Cursorposition einfügen -------------------------
	/** @param {string} text */
	async function insertAtCursor(text) {
		const el = taEl;
		const start = el?.selectionStart ?? buffer.length;
		const end = el?.selectionEnd ?? buffer.length;
		buffer = buffer.slice(0, start) + text + buffer.slice(end);
		await tick();
		const pos = start + text.length;
		el?.focus();
		el?.setSelectionRange(pos, pos);
	}

	// --- Aktionen -------------------------------------------------------------
	let saving = $state(false);
	let actionError = $state('');

	async function save() {
		saving = true;
		actionError = '';
		try {
			const res = await fetch('/api/email/setEmailTemplate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: template.name, markdown: buffer })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				// Backend lehnt nicht-parsendes Markdown ab → NICHT als gespeichert markieren.
				actionError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			onsaved?.(d.setEmailTemplate);
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function resetToDefault() {
		if (
			!confirm(
				`Vorlage „${template.description}" auf den Auslieferungsstand zurücksetzen? Die eigene Anpassung geht verloren.`
			)
		)
			return;
		saving = true;
		actionError = '';
		try {
			const res = await fetch('/api/email/resetEmailTemplate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: template.name })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				actionError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			buffer = template.defaultMarkdown;
			onsaved?.({ ...template, markdown: template.defaultMarkdown, isDefault: true });
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	const discard = () => (buffer = template.markdown);

	function back() {
		if (dirty && !confirm('Ungespeicherte Änderungen verwerfen und zur Liste zurück?')) return;
		onback?.();
	}

	// --- Vor Verlassen mit ungespeicherten Änderungen warnen ------------------
	beforeNavigate((nav) => {
		if (dirty && !confirm('Ungespeicherte Änderungen verwerfen?')) nav.cancel();
	});
	$effect(() => {
		/** @param {BeforeUnloadEvent} e */
		const onBeforeUnload = (e) => {
			if (dirty) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});
</script>

<div class="flex flex-col gap-4">
	<!-- Kopf: Titel, Status, Aktionen -->
	<div class="flex flex-wrap items-center gap-3">
		<button class="btn btn-ghost btn-sm" onclick={back}>← Liste</button>
		<div class="flex flex-col">
			<div class="flex items-center gap-2">
				<h1 class="text-xl font-semibold">{template.description}</h1>
				{#if template.isDefault}
					<span class="badge badge-ghost badge-sm">Standard</span>
				{:else}
					<span class="badge badge-warning badge-sm">angepasst</span>
				{/if}
				{#if dirty}
					<span class="badge badge-info badge-sm">ungespeichert</span>
				{/if}
			</div>
			<span class="font-mono text-xs text-base-content/50">{template.name}</span>
		</div>
		<div class="flex-1"></div>
		<button class="btn btn-ghost btn-sm" onclick={discard} disabled={!dirty || saving}>
			Verwerfen
		</button>
		<WriteButton
			class="btn btn-ghost btn-sm text-error"
			onclick={resetToDefault}
			disabled={saving || template.isDefault}
			title={template.isDefault ? 'Es ist bereits der Standard aktiv' : ''}
		>
			Auf Standard zurücksetzen
		</WriteButton>
		<WriteButton class="btn btn-primary btn-sm" onclick={save} disabled={!dirty || saving}>
			{saving ? 'speichert …' : 'Speichern'}
		</WriteButton>
	</div>

	{#if actionError}
		<div class="alert alert-error py-2 text-sm"><span>{actionError}</span></div>
	{/if}

	<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
		<!-- LINKS: Editor / Diff + Referenz -->
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<div role="tablist" class="tabs tabs-boxed tabs-sm w-fit">
					<button
						role="tab"
						class="tab {view === 'edit' ? 'tab-active' : ''}"
						onclick={() => (view = 'edit')}>Bearbeiten</button
					>
					<button
						role="tab"
						class="tab {view === 'diff' ? 'tab-active' : ''}"
						onclick={() => (view = 'diff')}>Änderungen (Diff)</button
					>
				</div>

				{#if view === 'edit'}
					<textarea
						bind:this={taEl}
						bind:value={buffer}
						spellcheck="false"
						class="textarea textarea-bordered h-[55vh] w-full resize-y font-mono text-sm leading-relaxed"
					></textarea>
				{:else}
					<!-- Diff gegen den gespeicherten Stand -->
					{@const savedRows = lineDiff(template.markdown, buffer)}
					{@const savedStat = diffStat(savedRows)}
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm font-medium">
							<span>Gegenüber gespeichert</span>
							<span class="font-mono text-xs text-success">+{savedStat.added}</span>
							<span class="font-mono text-xs text-error">−{savedStat.removed}</span>
							{#if !dirty}<span class="text-xs text-base-content/50">keine Änderungen</span>{/if}
						</div>
						{@render diffBlock(savedRows)}
					</div>

					<!-- Diff gegen den Auslieferungsstand (Default) -->
					{@const defRows = lineDiff(template.defaultMarkdown, buffer)}
					{@const defStat = diffStat(defRows)}
					<div class="mt-2 flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm font-medium">
							<span>Gegenüber Standard</span>
							<span class="font-mono text-xs text-success">+{defStat.added}</span>
							<span class="font-mono text-xs text-error">−{defStat.removed}</span>
							{#if !changedVsDefault}
								<span class="text-xs text-base-content/50">entspricht dem Standard</span>
							{/if}
						</div>
						{@render diffBlock(defRows)}
					</div>
				{/if}

				<p class="text-xs text-base-content/50">
					Platzhalter in doppelten geschweiften Klammern
					<span class="font-mono">{'{{ … }}'}</span> werden beim Versand durch echte Werte ersetzt.
				</p>
			</div>

			<!-- Variablen-Referenz -->
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="flex items-center gap-2">
					<h2 class="text-sm font-semibold">Platzhalter dieser Vorlage</h2>
					<span class="badge badge-ghost badge-sm tabular-nums">
						{(template.variables ?? []).length}
					</span>
				</div>
				<p class="text-xs text-base-content/50">
					Klick fügt den Platzhalter an der Cursorposition ein. Der <em>Beispiel</em>-Wert erscheint
					in der Vorschau rechts.
				</p>
				{#if (template.variables ?? []).length === 0}
					<div class="text-xs text-base-content/40">Keine Platzhalter für diese Vorlage.</div>
				{:else}
					<div class="flex flex-col divide-y divide-base-200">
						{#each template.variables as v (v.name)}
							<button
								type="button"
								class="group flex flex-col gap-0.5 py-2 text-left hover:bg-base-200/50"
								onclick={() => insertAtCursor(v.name)}
								title="An Cursorposition einfügen"
							>
								<div class="flex items-center gap-2">
									<code class="rounded bg-base-200 px-1 py-0.5 font-mono text-xs">{v.name}</code>
									<span class="text-xs text-base-content/40 opacity-0 group-hover:opacity-100">
										einfügen
									</span>
								</div>
								<span class="text-xs text-base-content/70">{v.description}</span>
								{#if v.example}
									<span class="text-xs text-base-content/50">
										Beispiel: <span class="font-mono">{v.example}</span>
									</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}

				<!-- globale Funktionen (einklappbar) -->
				<div class="collapse-arrow collapse mt-1 border border-base-200">
					<input type="checkbox" bind:checked={showFunctions} />
					<div class="collapse-title py-2 text-sm font-medium">
						Funktionen in jeder Vorlage verfügbar
						<span class="badge badge-ghost badge-sm tabular-nums">{functions.length}</span>
					</div>
					<div class="collapse-content">
						<div class="flex flex-col divide-y divide-base-200">
							{#each functions as fn (fn.name)}
								<div class="flex flex-col gap-0.5 py-2">
									<code class="w-fit rounded bg-base-200 px-1 py-0.5 font-mono text-xs">
										{fn.usage}
									</code>
									<span class="text-xs text-base-content/70">{fn.description}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- RECHTS: Live-Vorschau -->
		<div class="flex flex-col gap-2">
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="text-sm font-semibold">Vorschau</h2>
					{#if previewLoading}
						<span class="loading loading-spinner loading-xs"></span>
					{/if}
					<div class="flex-1"></div>
					<div role="tablist" class="tabs tabs-boxed tabs-xs">
						<button
							role="tab"
							class="tab {previewMode === 'html' ? 'tab-active' : ''}"
							onclick={() => (previewMode = 'html')}>HTML</button
						>
						<button
							role="tab"
							class="tab {previewMode === 'text' ? 'tab-active' : ''}"
							onclick={() => (previewMode = 'text')}>Klartext</button
						>
					</div>
				</div>
				<p class="text-xs text-base-content/50">
					Beispielwerte — die echte E-Mail nutzt die tatsächlichen Empfänger- und Prüfungsdaten.
				</p>

				<div class="h-[55vh] overflow-hidden rounded-md border border-base-300 bg-white text-black">
					{#if preview.error}
						<div class="flex h-full flex-col gap-2 overflow-auto bg-error/10 p-4">
							<div class="font-semibold text-error">Vorlage lässt sich nicht rendern</div>
							<pre class="whitespace-pre-wrap font-mono text-xs text-error">{preview.error}</pre>
						</div>
					{:else if previewMode === 'html'}
						<iframe
							title="E-Mail-Vorschau"
							sandbox=""
							srcdoc={preview.html}
							class="h-full w-full border-0"
						></iframe>
					{:else}
						<pre
							class="h-full overflow-auto whitespace-pre-wrap p-4 font-mono text-xs text-black">{preview.text}</pre>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Zeilen-Diff-Ansicht -->
{#snippet diffBlock(/** @type {import('$lib/email/templateDiff').DiffRow[]} */ rows)}
	<div class="overflow-x-auto rounded-md border border-base-300 bg-base-100">
		<table class="w-full border-collapse font-mono text-xs">
			<tbody>
				{#each rows as r, i (i)}
					<tr class={r.type === 'add' ? 'bg-success/15' : r.type === 'del' ? 'bg-error/15' : ''}>
						<td class="w-6 select-none px-2 text-center text-base-content/40">
							{r.type === 'add' ? '+' : r.type === 'del' ? '−' : ''}
						</td>
						<td class="whitespace-pre-wrap py-0.5 pr-2">{r.text || ' '}</td>
					</tr>
				{:else}
					<tr><td class="px-2 py-1 text-base-content/40">(leer)</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}
