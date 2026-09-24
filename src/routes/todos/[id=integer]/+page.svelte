<script>
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { isAdmin, isViewer } from '$lib/auth';
	import Markdown from '$lib/Markdown.svelte';
	import WriteButton from '$lib/WriteButton.svelte';
	import LinkChip from '$lib/todo/LinkChip.svelte';
	import LinkPicker from '$lib/todo/LinkPicker.svelte';
	import TodoComments from '$lib/todo/TodoComments.svelte';
	import TodoEditor from '$lib/todo/TodoEditor.svelte';
	import { addTodoLink, deleteTodo, removeTodoLink, setTodoDone } from '$lib/todo/client.js';
	import {
		formatDate,
		formatDateTime,
		isOverdue,
		PRIORITY_LABEL,
		todayISO
	} from '$lib/todo/todo.js';

	let { data } = $props();

	let todo = $derived(data.todo);
	let me = $derived($page.data?.me);
	let viewer = $derived(isViewer(me));
	// Löschen dürfen Ersteller:in und ADMIN (das Backend prüft es ohnehin); ohne
	// Anmeldung (lokal) gibt es keine Einschränkung.
	let canDelete = $derived(!me || isAdmin(me) || me.email === todo.createdBy);

	let editing = $state(false);
	let busy = $state(false);
	let error = $state('');

	/** @param {() => Promise<unknown>} fn */
	async function run(fn) {
		busy = true;
		error = '';
		try {
			await fn();
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	async function remove() {
		if (!confirm(`Todo „${todo.title}" samt Kommentaren löschen? Erledigen ist meist besser.`))
			return;
		busy = true;
		try {
			await deleteTodo(todo.id);
			await goto('/todos');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			busy = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex max-w-4xl flex-col gap-4">
	<a href="/todos" class="link link-hover text-sm text-base-content/50">← alle Todos</a>

	{#if error}
		<div class="alert alert-error py-2 text-sm">
			<span>{error}</span>
			<button class="btn btn-ghost btn-xs" onclick={() => (error = '')}>✕</button>
		</div>
	{/if}

	<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex flex-wrap items-start gap-3">
			<input
				type="checkbox"
				class="checkbox mt-1"
				checked={todo.done}
				disabled={viewer || busy}
				aria-label="erledigt"
				onchange={() => run(() => setTodoDone(todo.id, !todo.done))}
			/>
			<h1
				class="flex-1 text-2xl font-semibold {todo.done ? 'text-base-content/50 line-through' : ''}"
			>
				{todo.title}
			</h1>
			<WriteButton class="btn btn-outline btn-sm" onclick={() => (editing = true)}>
				Bearbeiten
			</WriteButton>
			{#if canDelete}
				<WriteButton class="btn btn-ghost btn-sm text-error" onclick={remove} disabled={busy}>
					Löschen
				</WriteButton>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-2 text-sm">
			{#if todo.done}
				<span class="badge badge-success badge-sm">erledigt</span>
			{/if}
			<span class="badge badge-sm {todo.priority === 'HIGH' ? 'badge-error' : 'badge-ghost'}">
				Priorität {PRIORITY_LABEL[todo.priority]}
			</span>
			{#if todo.dueDate}
				<span class="badge badge-sm {isOverdue(todo, todayISO()) ? 'badge-error' : 'badge-ghost'}">
					📅 fällig {formatDate(todo.dueDate)}
				</span>
			{/if}
			{#if todo.recurring}
				<span class="badge badge-ghost badge-sm">🔁 jedes Semester</span>
			{/if}
			{#each todo.labels as label}
				<a class="badge badge-outline badge-sm" href="/todos?label={encodeURIComponent(label)}"
					>{label}</a
				>
			{/each}
		</div>

		{#if todo.description}
			<Markdown src={todo.description} />
		{/if}

		<p class="text-xs text-base-content/50">
			angelegt von {todo.createdByName} am {formatDateTime(todo.createdAt)}
			{#if todo.carriedFromSemester}
				· übernommen aus {todo.carriedFromSemester}
			{/if}
			{#if todo.done}
				· erledigt von {todo.doneByName ?? todo.doneBy} am {formatDateTime(todo.doneAt)}
			{/if}
		</p>
	</section>

	<section class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
		<h2 class="font-semibold">Verknüpft mit</h2>
		{#if todo.links.length}
			<div class="flex flex-wrap gap-1">
				{#each todo.links as link (link.kind + ':' + link.key)}
					<LinkChip
						{link}
						disabled={busy}
						onremove={viewer ? undefined : () => run(() => removeTodoLink(todo.id, link))}
					/>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-base-content/50">Noch nichts verknüpft.</p>
		{/if}
		{#if !viewer}
			<LinkPicker
				disabled={busy}
				onpick={async (link) => {
					await addTodoLink(todo.id, link);
					await invalidateAll();
				}}
			/>
		{/if}
	</section>

	<section class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
		<h2 class="font-semibold">Kommentare</h2>
		<TodoComments todoId={todo.id} comments={todo.comments} />
	</section>
</div>

{#if editing}
	<TodoEditor
		{todo}
		onclose={() => (editing = false)}
		onsaved={async () => {
			editing = false;
			await invalidateAll();
		}}
	/>
{/if}
