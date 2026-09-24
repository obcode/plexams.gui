<!--
	Todo anlegen oder bearbeiten (Modal). Beim Bearbeiten werden die Links mit
	gespeichert (ersetzt); vorbelegte Links (presetLinks) dienen dem „+ Todo" an
	verlinkten Daten, z. B. auf der Prüfungsseite.
-->
<script>
	import { untrack } from 'svelte';
	import WriteButton from '$lib/WriteButton.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import LinkChip from './LinkChip.svelte';
	import LinkPicker from './LinkPicker.svelte';
	import { createTodo, fetchLabels, updateTodo } from './client.js';
	import { PRIORITY_LABEL, parseLabels } from './todo.js';

	/**
	 * @typedef {Object} Props
	 * @property {any} [todo] zu bearbeitendes Todo; fehlt es, wird eins angelegt
	 * @property {{ kind: string, key: string, label?: string, href?: string | null }[]} [presetLinks]
	 * @property {() => void} onclose
	 * @property {(todo: any) => void | Promise<void>} onsaved
	 */

	/** @type {Props} */
	let { todo = null, presetLinks = [], onclose, onsaved } = $props();

	// Formularzustand: einmalig aus den Props übernommen (der Dialog wird pro
	// Bearbeitung neu erzeugt).
	const initial = untrack(() => todo);
	let title = $state(initial?.title ?? '');
	let description = $state(initial?.description ?? '');
	let priority = $state(initial?.priority ?? 'NORMAL');
	let dueDate = $state(initial?.dueDate ?? '');
	let labels = $state((initial?.labels ?? []).join(', '));
	let recurring = $state(initial?.recurring ?? false);
	/** @type {{ kind: string, key: string, label?: string, href?: string | null }[]} */
	let links = $state(untrack(() => [...(initial?.links ?? presetLinks)]));

	let preview = $state(false);
	let saving = $state(false);
	let error = $state('');
	/** @type {string[]} */
	let knownLabels = $state([]);
	fetchLabels()
		.then((l) => (knownLabels = l))
		.catch(() => {});

	/** @param {{ kind: string, key: string, label: string }} link */
	function addLink(link) {
		if (!links.some((l) => l.kind === link.kind && l.key === link.key)) {
			links = [...links, link];
		}
	}

	/** @param {{ kind: string, key: string }} link */
	function removeLink(link) {
		links = links.filter((l) => !(l.kind === link.kind && l.key === link.key));
	}

	async function save() {
		if (!title.trim()) {
			error = 'Bitte einen Titel angeben.';
			return;
		}
		saving = true;
		error = '';
		const input = {
			title,
			description,
			priority,
			dueDate: dueDate || null,
			labels: parseLabels(labels),
			recurring,
			links: links.map((l) => ({ kind: l.kind, key: l.key }))
		};
		try {
			const saved = initial ? await updateTodo(initial.id, input) : await createTodo(input);
			await onsaved(saved);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="modal modal-open">
	<div class="modal-box max-w-2xl">
		<h2 class="text-lg font-semibold">{initial ? 'Todo bearbeiten' : 'Neues Todo'}</h2>
		<div class="mt-3 flex flex-col gap-3">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Titel</span>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="text"
					class="input input-bordered input-sm"
					bind:value={title}
					autofocus
					onkeydown={(e) => e.key === 'Enter' && save()}
				/>
			</label>

			<div class="flex flex-col gap-1">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-base-content/60">Beschreibung (Markdown)</span>
					<div role="tablist" class="tabs tabs-box tabs-xs">
						<button
							role="tab"
							class="tab {preview ? '' : 'tab-active'}"
							onclick={() => (preview = false)}>Schreiben</button
						>
						<button
							role="tab"
							class="tab {preview ? 'tab-active' : ''}"
							onclick={() => (preview = true)}>Vorschau</button
						>
					</div>
				</div>
				{#if preview}
					<div class="min-h-24 rounded-lg border border-base-300 p-2">
						{#if description.trim()}
							<Markdown src={description} />
						{:else}
							<span class="text-sm text-base-content/40">(leer)</span>
						{/if}
					</div>
				{:else}
					<textarea
						class="textarea textarea-bordered textarea-sm min-h-24 w-full font-mono"
						bind:value={description}
						placeholder="**fett**, _kursiv_, - Listen, [Links](https://…)"></textarea>
				{/if}
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Priorität</span>
					<select class="select select-bordered select-sm" bind:value={priority}>
						{#each ['HIGH', 'NORMAL', 'LOW'] as p}
							<option value={p}>{PRIORITY_LABEL[p]}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Fällig am</span>
					<input type="date" class="input input-bordered input-sm" bind:value={dueDate} />
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Labels (mit Komma)</span>
					<input
						type="text"
						class="input input-bordered input-sm"
						list="todo-known-labels"
						bind:value={labels}
						placeholder="z. B. räume, mail"
					/>
					<datalist id="todo-known-labels">
						{#each knownLabels as l}
							<option value={l}></option>
						{/each}
					</datalist>
				</label>
			</div>

			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="checkbox checkbox-sm" bind:checked={recurring} />
				<span class="text-sm">
					jedes Semester <span class="text-base-content/50"
						>(wird bei der Übernahme ins nächste Semester wieder geöffnet)</span
					>
				</span>
			</label>

			<div class="flex flex-col gap-2">
				<span class="text-xs font-medium text-base-content/60">Verknüpft mit</span>
				{#if links.length}
					<div class="flex flex-wrap gap-1">
						{#each links as link (link.kind + ':' + link.key)}
							<LinkChip {link} onremove={() => removeLink(link)} />
						{/each}
					</div>
				{/if}
				<LinkPicker onpick={addLink} />
				<span class="text-xs text-base-content/40">
					Geprüft wird beim Speichern — eine unbekannte Prüfung o. Ä. wird dann abgelehnt.
				</span>
			</div>
		</div>

		{#if error}
			<div class="alert alert-error mt-3 py-2 text-sm"><span>{error}</span></div>
		{/if}
		<div class="modal-action">
			<button class="btn btn-ghost btn-sm" onclick={onclose} disabled={saving}>Abbrechen</button>
			<WriteButton class="btn btn-primary btn-sm" onclick={save} disabled={saving}>
				{saving ? 'speichert …' : 'Speichern'}
			</WriteButton>
		</div>
	</div>
	<button class="modal-backdrop" aria-label="schließen" onclick={onclose}></button>
</div>
