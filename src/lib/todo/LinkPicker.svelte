<!--
	Einen Link für ein Todo auswählen: Art wählen, dann aus Vorschlägen des Backends
	(todoLinkSuggestions) wählen oder — bei URL/Jira — frei eingeben. Geprüft wird
	im Backend; hier wird nur der Schlüssel ermittelt.
-->
<script>
	import { fetchLinkSuggestions } from './client.js';
	import { FREE_TEXT_KINDS, LINK_KINDS } from './todo.js';

	/**
	 * @typedef {Object} Props
	 * @property {(link: { kind: string, key: string, label: string }) => void | Promise<void>} onpick
	 * @property {boolean} [disabled]
	 */

	/** @type {Props} */
	let { onpick, disabled = false } = $props();

	let kind = $state('EXAM');
	let input = $state('');
	/** @type {{ key: string, label: string }[]} */
	let suggestions = $state([]);
	let error = $state('');
	const listId = `todo-link-suggestions-${Math.random().toString(36).slice(2)}`;

	let freeText = $derived(FREE_TEXT_KINDS.has(kind));

	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;
	function loadSuggestions() {
		clearTimeout(timer);
		if (freeText) {
			suggestions = [];
			return;
		}
		const k = kind;
		const q = input;
		timer = setTimeout(async () => {
			try {
				const s = await fetchLinkSuggestions(k, q);
				if (k === kind) suggestions = s;
			} catch (e) {
				error = e instanceof Error ? e.message : String(e);
			}
		}, 200);
	}

	function changeKind() {
		input = '';
		error = '';
		loadSuggestions();
	}

	async function pick() {
		const value = input.trim();
		if (!value) return;
		// Eingetippt wurde evtl. der Anzeigename statt des Schlüssels.
		const match =
			suggestions.find((s) => s.key === value) ??
			suggestions.find((s) => s.label.toLowerCase() === value.toLowerCase());
		error = '';
		try {
			await onpick({ kind, key: match?.key ?? value, label: match?.label ?? value });
			input = '';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}
</script>

<div class="flex flex-col gap-1">
	<div class="flex flex-wrap items-center gap-2">
		<select
			class="select select-bordered select-sm w-full sm:w-44"
			bind:value={kind}
			onchange={changeKind}
			{disabled}
		>
			{#each LINK_KINDS as k}
				<option value={k.kind}>{k.icon} {k.label}</option>
			{/each}
		</select>
		<input
			type="text"
			class="input input-bordered input-sm w-full flex-1 sm:w-auto"
			list={freeText ? undefined : listId}
			placeholder={kind === 'URL'
				? 'https://…'
				: kind === 'JIRA'
					? 'z. B. PLEX-42'
					: 'suchen (Name, Kürzel, Nummer …)'}
			bind:value={input}
			oninput={loadSuggestions}
			onfocus={loadSuggestions}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					pick();
				}
			}}
			{disabled}
		/>
		<button class="btn btn-outline btn-sm" onclick={pick} disabled={disabled || !input.trim()}>
			+ Link
		</button>
	</div>
	<datalist id={listId}>
		{#each suggestions as s (s.key)}
			<option value={s.key}>{s.label}</option>
		{/each}
	</datalist>
	{#if error}
		<span class="text-xs text-error">{error}</span>
	{/if}
</div>
