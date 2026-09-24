<!--
	Einen Link für ein Todo auswählen: Art wählen, dann nach Name, Kürzel oder
	Nummer suchen und einen Vorschlag des Backends (todoLinkSuggestions) wählen —
	bei URL/Jira frei eingeben. Verlinkt wird der Schlüssel (z. B. die ZPA-Nummer
	einer/eines Prüfenden), gesucht wird über den Anzeigenamen.

	Bewusst kein <datalist>: dessen Option-Wert ist der Schlüssel, und je nach
	Browser wird nur danach gefiltert — die Suche nach „Braun" fände dann nichts.
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
	let open = $state(false);
	let highlight = $state(-1);
	let error = $state('');
	const listId = `todo-link-suggestions-${Math.random().toString(36).slice(2)}`;

	let freeText = $derived(FREE_TEXT_KINDS.has(kind));

	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;
	function loadSuggestions() {
		clearTimeout(timer);
		if (freeText) {
			suggestions = [];
			open = false;
			return;
		}
		const k = kind;
		const q = input;
		timer = setTimeout(async () => {
			try {
				const s = await fetchLinkSuggestions(k, q);
				if (k !== kind || q !== input) return; // veraltete Antwort
				suggestions = s;
				highlight = s.length ? 0 : -1;
				open = true;
			} catch (e) {
				error = e instanceof Error ? e.message : String(e);
			}
		}, 200);
	}

	function changeKind() {
		input = '';
		error = '';
		suggestions = [];
		open = false;
	}

	/** @param {{ key: string, label: string }} s */
	async function choose(s) {
		error = '';
		open = false;
		try {
			await onpick({ kind, key: s.key, label: s.label || s.key });
			input = '';
			suggestions = [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function submit() {
		const value = input.trim();
		if (!value) return;
		if (freeText) {
			await choose({ key: value, label: value });
			return;
		}
		if (open && highlight >= 0 && suggestions[highlight]) {
			await choose(suggestions[highlight]);
			return;
		}
		const exact = suggestions.find((s) => s.key === value);
		if (exact) {
			await choose(exact);
		} else {
			error = 'Bitte einen Eintrag aus der Liste wählen.';
		}
	}

	/** @param {KeyboardEvent} e */
	function onkeydown(e) {
		if (e.key === 'ArrowDown' && suggestions.length) {
			e.preventDefault();
			open = true;
			highlight = (highlight + 1) % suggestions.length;
		} else if (e.key === 'ArrowUp' && suggestions.length) {
			e.preventDefault();
			open = true;
			highlight = (highlight - 1 + suggestions.length) % suggestions.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			submit();
		} else if (e.key === 'Escape') {
			open = false;
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
		<div class="relative w-full flex-1 sm:w-auto">
			<input
				type="text"
				class="input input-bordered input-sm w-full"
				role="combobox"
				aria-expanded={open}
				aria-controls={listId}
				aria-autocomplete="list"
				autocomplete="off"
				placeholder={kind === 'URL'
					? 'https://…'
					: kind === 'JIRA'
						? 'z. B. PLEX-42'
						: 'suchen nach Name, Kürzel, Nummer …'}
				bind:value={input}
				oninput={() => {
					error = '';
					loadSuggestions();
				}}
				onfocus={loadSuggestions}
				onblur={() => setTimeout(() => (open = false), 150)}
				{onkeydown}
				{disabled}
			/>
			{#if open && !freeText}
				<ul
					id={listId}
					role="listbox"
					class="absolute top-full left-0 z-50 mt-1 max-h-64 w-full min-w-64 overflow-y-auto rounded-lg border border-base-300 bg-base-100 p-1 shadow-lg"
				>
					{#each suggestions as s, i (s.key)}
						<li role="option" aria-selected={i === highlight}>
							<button
								type="button"
								class="flex w-full items-baseline gap-2 rounded px-2 py-1 text-left text-sm {i ===
								highlight
									? 'bg-primary/15 text-primary'
									: 'hover:bg-base-200'}"
								onmousedown={(e) => e.preventDefault()}
								onclick={() => choose(s)}
								onmouseenter={() => (highlight = i)}
							>
								<span class="flex-1">{s.label || s.key}</span>
								{#if s.label && s.label !== s.key && !s.label.startsWith(s.key)}
									<span class="font-mono text-xs text-base-content/50">{s.key}</span>
								{/if}
							</button>
						</li>
					{:else}
						<li class="px-2 py-1 text-sm text-base-content/50">Keine Treffer.</li>
					{/each}
				</ul>
			{/if}
		</div>
		<button class="btn btn-outline btn-sm" onclick={submit} disabled={disabled || !input.trim()}>
			+ Link
		</button>
	</div>
	{#if error}
		<span class="text-xs text-error">{error}</span>
	{/if}
</div>
