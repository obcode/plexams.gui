<!--
	Kommentar-Verlauf eines Todos: Markdown, älteste zuerst; eigene Kommentare
	lassen sich bearbeiten. Neue Kommentare unten.
-->
<script>
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { isViewer } from '$lib/auth';
	import Markdown from '$lib/Markdown.svelte';
	import WriteButton from '$lib/WriteButton.svelte';
	import { addTodoComment, updateTodoComment } from './client.js';
	import { formatDateTime } from './todo.js';

	/**
	 * @typedef {Object} Props
	 * @property {number} todoId
	 * @property {any[]} comments
	 */

	/** @type {Props} */
	let { todoId, comments } = $props();

	let body = $state('');
	let busy = $state(false);
	let error = $state('');
	/** @type {number | null} */
	let editingId = $state(null);
	let editBody = $state('');

	let myEmail = $derived($page.data?.me?.email ?? null);

	async function add() {
		if (!body.trim()) return;
		busy = true;
		error = '';
		try {
			await addTodoComment(todoId, body);
			body = '';
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	/** @param {any} c */
	function startEdit(c) {
		editingId = c.id;
		editBody = c.body;
	}

	async function saveEdit() {
		if (editingId === null || !editBody.trim()) return;
		busy = true;
		error = '';
		try {
			await updateTodoComment(editingId, editBody);
			editingId = null;
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	{#each comments as c (c.id)}
		<div class="flex flex-col gap-1 rounded-lg bg-base-200/50 p-3">
			<div class="flex flex-wrap items-baseline gap-x-2 text-xs text-base-content/60">
				<span class="font-medium text-base-content/80">{c.authorName}</span>
				<span>{formatDateTime(c.createdAt)}</span>
				{#if c.editedAt}
					<span title="bearbeitet {formatDateTime(c.editedAt)}">(bearbeitet)</span>
				{/if}
				<div class="flex-1"></div>
				{#if myEmail === c.author && editingId !== c.id}
					<WriteButton class="btn btn-ghost btn-xs" onclick={() => startEdit(c)}>
						bearbeiten
					</WriteButton>
				{/if}
			</div>
			{#if editingId === c.id}
				<textarea
					class="textarea textarea-bordered textarea-sm min-h-20 w-full font-mono"
					bind:value={editBody}></textarea>
				<div class="flex justify-end gap-2">
					<button class="btn btn-ghost btn-xs" onclick={() => (editingId = null)} disabled={busy}
						>Abbrechen</button
					>
					<WriteButton class="btn btn-primary btn-xs" onclick={saveEdit} disabled={busy}>
						Speichern
					</WriteButton>
				</div>
			{:else}
				<Markdown src={c.body} />
			{/if}
		</div>
	{:else}
		<p class="text-sm text-base-content/50">Noch keine Kommentare.</p>
	{/each}

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	{#if !isViewer($page.data?.me)}
		<div class="flex flex-col gap-2">
			<textarea
				class="textarea textarea-bordered textarea-sm min-h-20 w-full"
				bind:value={body}
				placeholder="Kommentar (Markdown) …"
				onkeydown={(e) => {
					if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add();
				}}></textarea>
			<div class="flex items-center justify-end gap-2">
				<span class="text-xs text-base-content/40">Strg+Enter</span>
				<WriteButton class="btn btn-primary btn-sm" onclick={add} disabled={busy || !body.trim()}>
					Kommentieren
				</WriteButton>
			</div>
		</div>
	{/if}
</div>
