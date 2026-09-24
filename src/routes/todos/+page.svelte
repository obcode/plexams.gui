<script>
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import WriteButton from '$lib/WriteButton.svelte';
	import LinkChip from '$lib/todo/LinkChip.svelte';
	import TodoEditor from '$lib/todo/TodoEditor.svelte';
	import TodoList from '$lib/todo/TodoList.svelte';
	import { carryOverTodos } from '$lib/todo/client.js';
	import { filterTodos, LINK_KINDS, parseLinkParam, PRIORITY_LABEL } from '$lib/todo/todo.js';

	let { data } = $props();

	// Filter stehen in der URL, damit sich eine gefilterte Ansicht verlinken lässt
	// (z. B. „Todos zu Phase 1" von der Startseite).
	let params = $derived($page.url.searchParams);
	let status = $derived(/** @type {'open' | 'done' | 'all'} */ (params.get('status') ?? 'open'));
	let label = $derived(params.get('label') ?? '');
	let priority = $derived(params.get('priority') ?? '');
	let kind = $derived(params.get('kind') ?? '');
	let link = $derived(parseLinkParam(params.get('link')));
	let text = $state('');

	/**
	 * @param {string} name
	 * @param {string} value leer = Filter entfernen
	 */
	function setParam(name, value) {
		const url = new URL($page.url);
		if (value) url.searchParams.set(name, value);
		else url.searchParams.delete(name);
		goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	}

	let todos = $derived(filterTodos(data.todos, { status, label, priority, kind, link, text }));
	let openCount = $derived(data.todos.filter((/** @type {any} */ t) => !t.done).length);
	// Anzeigename des Link-Filters aus einem der Todos.
	let linkLabel = $derived.by(() => {
		if (!link) return null;
		for (const t of data.todos) {
			const l = t.links.find((/** @type {any} */ x) => x.kind === link.kind && x.key === link.key);
			if (l) return l;
		}
		return { ...link, label: link.key, href: null };
	});

	let creating = $state(false);
	let carrying = $state(false);
	let message = $state('');
	let error = $state('');

	async function carryOver() {
		if (!data.fromSemester) return;
		if (
			!confirm(
				`${data.carryOverCandidates} Todos aus ${data.fromSemester} übernehmen? ` +
					'Die offenen Originale werden dort geschlossen; Links auf Prüfungen und Tage entfallen.'
			)
		)
			return;
		carrying = true;
		error = '';
		try {
			const n = await carryOverTodos(data.fromSemester);
			message = `${n} Todos aus ${data.fromSemester} übernommen.`;
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			carrying = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Todos {data.semester}</h1>
		<span class="badge badge-primary badge-lg tabular-nums" title="offen">{openCount}</span>
		<div class="flex-1"></div>
		<WriteButton class="btn btn-primary btn-sm" onclick={() => (creating = true)}>
			+ Neues Todo
		</WriteButton>
	</div>

	{#if data.carryOverCandidates > 0}
		<div class="alert alert-info py-2 text-sm">
			<span>
				Aus {data.fromSemester} sind noch {data.carryOverCandidates} Todos offen oder wiederkehrend.
			</span>
			<WriteButton class="btn btn-sm" onclick={carryOver} disabled={carrying}>
				{carrying ? 'übernimmt …' : 'Übernehmen'}
			</WriteButton>
		</div>
	{/if}
	{#if message}
		<div class="alert alert-success py-2 text-sm"><span>{message}</span></div>
	{/if}
	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	<!-- Filterleiste -->
	<div
		class="flex flex-wrap items-center gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-2"
	>
		<div class="join">
			{#each [['open', 'offen'], ['done', 'erledigt'], ['all', 'alle']] as [value, text]}
				<button
					class="btn join-item btn-sm {status === value ? 'btn-active' : ''}"
					onclick={() => setParam('status', value === 'open' ? '' : value)}>{text}</button
				>
			{/each}
		</div>
		<select
			class="select select-bordered select-sm w-full sm:w-40"
			value={priority}
			onchange={(e) => setParam('priority', e.currentTarget.value)}
		>
			<option value="">alle Prioritäten</option>
			{#each ['HIGH', 'NORMAL', 'LOW'] as p}
				<option value={p}>{PRIORITY_LABEL[p]}</option>
			{/each}
		</select>
		<select
			class="select select-bordered select-sm w-full sm:w-40"
			value={label}
			onchange={(e) => setParam('label', e.currentTarget.value)}
		>
			<option value="">alle Labels</option>
			{#each data.labels as l}
				<option value={l}>{l}</option>
			{/each}
		</select>
		<select
			class="select select-bordered select-sm w-full sm:w-48"
			value={kind}
			onchange={(e) => setParam('kind', e.currentTarget.value)}
		>
			<option value="">verknüpft mit …</option>
			{#each LINK_KINDS as k}
				<option value={k.kind}>{k.icon} {k.label}</option>
			{/each}
		</select>
		<input
			type="search"
			class="input input-bordered input-sm w-full sm:w-56"
			placeholder="suchen …"
			bind:value={text}
		/>
		{#if linkLabel}
			<span class="flex items-center gap-1 text-sm">
				nur zu <LinkChip link={linkLabel} onremove={() => setParam('link', '')} />
			</span>
		{/if}
	</div>

	<section class="rounded-lg border border-base-300 bg-base-100 p-4">
		<TodoList
			{todos}
			empty={data.todos.length ? 'Keine Todos für diesen Filter.' : 'Noch keine Todos angelegt.'}
		/>
	</section>
</div>

{#if creating}
	<TodoEditor
		presetLinks={link && linkLabel ? [linkLabel] : []}
		onclose={() => (creating = false)}
		onsaved={async () => {
			creating = false;
			await invalidateAll();
		}}
	/>
{/if}
