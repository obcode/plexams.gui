<!--
	Kompakte Todo-Liste: Haken zum Erledigen, Titel (→ Detailseite), Priorität,
	Fälligkeit, Labels, Links, Kommentarzahl. Nach einer Änderung ruft sie
	onchange (Standard: invalidateAll).
-->
<script>
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { isViewer } from '$lib/auth';
	import LinkChip from './LinkChip.svelte';
	import { setTodoDone } from './client.js';
	import { formatDate, isOverdue, PRIORITY_LABEL, todayISO } from './todo.js';

	/**
	 * @typedef {Object} Props
	 * @property {import('./todo.js').Todo[]} todos
	 * @property {boolean} [showLinks]
	 * @property {() => void | Promise<void>} [onchange]
	 * @property {string} [empty] Text, wenn die Liste leer ist
	 */

	/** @type {Props} */
	let { todos, showLinks = true, onchange = invalidateAll, empty = 'Keine Todos.' } = $props();

	const today = todayISO();
	let viewer = $derived(isViewer($page.data?.me));
	/** @type {Set<number>} */
	let busy = $state(new Set());
	let error = $state('');

	/** @param {import('./todo.js').Todo} todo */
	async function toggle(todo) {
		busy = new Set(busy).add(todo.id);
		error = '';
		try {
			await setTodoDone(todo.id, !todo.done);
			await onchange();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			const b = new Set(busy);
			b.delete(todo.id);
			busy = b;
		}
	}
</script>

{#if error}
	<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
{/if}

{#if todos.length === 0}
	<p class="text-sm text-base-content/50">{empty}</p>
{:else}
	<ul class="flex flex-col divide-y divide-base-200">
		{#each todos as todo (todo.id)}
			{@const overdue = isOverdue(todo, today)}
			<li class="flex items-start gap-2 py-1.5">
				<input
					type="checkbox"
					class="checkbox checkbox-sm mt-0.5"
					checked={todo.done}
					disabled={viewer || busy.has(todo.id)}
					title={todo.done ? 'wieder öffnen' : 'erledigt'}
					aria-label="erledigt: {todo.title}"
					onchange={() => toggle(todo)}
				/>
				<div class="flex min-w-0 flex-1 flex-col gap-1">
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<a
							href="/todos/{todo.id}"
							class="link link-hover text-sm font-medium {todo.done
								? 'text-base-content/50 line-through'
								: ''}">{todo.title}</a
						>
						{#if todo.priority !== 'NORMAL'}
							<span
								class="badge badge-sm {todo.priority === 'HIGH' ? 'badge-error' : 'badge-ghost'}"
								>{PRIORITY_LABEL[todo.priority]}</span
							>
						{/if}
						{#if todo.dueDate}
							<span
								class="badge badge-sm {overdue ? 'badge-error' : 'badge-ghost'}"
								title={overdue ? 'überfällig' : 'fällig'}
							>
								📅 {formatDate(todo.dueDate)}
							</span>
						{/if}
						{#if todo.recurring}
							<span class="text-xs" title="jedes Semester">🔁</span>
						{/if}
						{#each todo.labels as label}
							<a
								class="badge badge-outline badge-sm"
								href="/todos?label={encodeURIComponent(label)}">{label}</a
							>
						{/each}
						{#if todo.commentCount}
							<span class="text-xs text-base-content/50" title="Kommentare"
								>💬 {todo.commentCount}</span
							>
						{/if}
					</div>
					{#if showLinks && todo.links.length}
						<div class="flex flex-wrap gap-1">
							{#each todo.links as link (link.kind + ':' + link.key)}
								<LinkChip {link} />
							{/each}
						</div>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}
