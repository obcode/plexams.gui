<!--
	Die offenen Todos zu einem Objekt (Prüfung, Phase, Raum …) als eigene Box, mit
	„+ Todo", das den Link vorbelegt. Lädt sich selbst — einbauen genügt:

	  <LinkedTodos kind="EXAM" key={String(exam.ancode)} label="{exam.ancode}. {exam.module}" />

	Für VIEWER ohne Todos bleibt die Box unsichtbar.
-->
<script>
	import { page } from '$app/stores';
	import { isViewer } from '$lib/auth';
	import WriteButton from '$lib/WriteButton.svelte';
	import TodoEditor from './TodoEditor.svelte';
	import TodoList from './TodoList.svelte';
	import { fetchTodos } from './client.js';
	import { linkParam } from './todo.js';

	/**
	 * @typedef {Object} Props
	 * @property {string} kind
	 * @property {string} key
	 * @property {string} [label] Anzeigename des Objekts für den vorbelegten Link
	 */

	/** @type {Props} */
	let { kind, key, label } = $props();

	/** @type {import('./todo.js').Todo[]} */
	let todos = $state([]);
	let loaded = $state(false);
	let error = $state('');
	let creating = $state(false);

	let viewer = $derived(isViewer($page.data?.me));

	async function load() {
		try {
			todos = await fetchTodos({ done: false, link: { kind, key } });
			error = '';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loaded = true;
		}
	}

	$effect(() => {
		void kind;
		void key;
		load();
	});
</script>

{#if loaded && !(viewer && todos.length === 0)}
	<section class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class="font-semibold">Todos</h2>
			{#if todos.length}
				<span class="badge badge-sm badge-primary tabular-nums">{todos.length}</span>
			{/if}
			<div class="flex-1"></div>
			<a
				class="link link-hover text-xs text-base-content/50"
				href="/todos?link={encodeURIComponent(linkParam({ kind, key }))}&status=all"
				>alle, auch erledigte →</a
			>
			<WriteButton class="btn btn-outline btn-xs" onclick={() => (creating = true)}>
				+ Todo
			</WriteButton>
		</div>
		{#if error}
			<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
		{/if}
		<TodoList {todos} showLinks={false} onchange={load} empty="Keine offenen Todos." />
	</section>
{/if}

{#if creating}
	<TodoEditor
		presetLinks={[{ kind, key, label: label ?? key }]}
		onclose={() => (creating = false)}
		onsaved={async () => {
			creating = false;
			await load();
		}}
	/>
{/if}
