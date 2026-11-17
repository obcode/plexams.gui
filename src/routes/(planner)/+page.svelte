<script>
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import WriteButton from '$lib/WriteButton.svelte';
	import TodoEditor from '$lib/todo/TodoEditor.svelte';
	import TodoList from '$lib/todo/TodoList.svelte';
	import { linkParam, openTodosPerPhase, overdueFirst, todayISO } from '$lib/todo/todo.js';

	let { data } = $props();

	// Writable derived: folgt den Load-Daten, lässt sich aber nach einem Toggle
	// optimistisch überschreiben (setzt sich beim nächsten Load-Update neu).
	/** @type {any} */
	let planningState = $derived(data.planningState);

	/** @type {Set<string>} */
	let busy = $state(new Set());
	/** @type {string | null} */
	let errorMsg = $state(null);

	/** @type {Record<string, string>} */
	const AREA_LABEL = {
		EXAMS: 'Terminplan gesperrt — Entwurf verschickt / Prüfungsplan veröffentlicht',
		ROOMS: 'Raumzuordnung gesperrt — Raumplan veröffentlicht',
		INVIGILATIONS: 'Aufsichteneinteilung gesperrt — Aufsichtenplan veröffentlicht'
	};

	/** @param {any} cond */
	async function toggle(cond) {
		if (cond.auto || busy.has(cond.key)) return;
		busy = new Set(busy).add(cond.key);
		errorMsg = null;
		try {
			const res = await fetch('/api/semester/setPlanningCondition', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: cond.key, done: !cond.done })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				errorMsg = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			planningState = result.setPlanningCondition;
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(busy);
			s.delete(cond.key);
			busy = s;
		}
	}

	// Todos: die dringendsten offenen oben, dazu die Zahl je Phase auf den Karten.
	const TODOS_SHOWN = 8;
	let openTodos = $derived(overdueFirst(data.todos ?? [], todayISO()));
	let todosPerPhase = $derived(openTodosPerPhase(data.todos ?? [], planningState.phases));
	/** @type {{ kind: string, key: string, label: string }[] | null} */
	let newTodoLinks = $state(null);

	let doneCount = $derived(
		planningState.phases
			.flatMap((/** @type {any} */ p) => p.conditions)
			.filter((/** @type {any} */ c) => c.done).length
	);
	let totalCount = $derived(
		planningState.phases.flatMap((/** @type {any} */ p) => p.conditions).length
	);
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Prüfungsplanung {data.semester}</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{doneCount}/{totalCount}</span>
	</div>

	{#if planningState.blockedAreas.length}
		<div class="flex flex-col gap-1">
			{#each planningState.blockedAreas as area}
				<div class="alert alert-warning py-2 text-sm">
					<span>🔒 {AREA_LABEL[area] ?? `${area} gesperrt`}</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}

	<section class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class="font-semibold">Offene Todos</h2>
			<span class="badge badge-primary badge-sm tabular-nums">{openTodos.length}</span>
			<div class="flex-1"></div>
			<a class="link link-hover text-sm text-base-content/60" href="/todos">alle Todos →</a>
			<WriteButton class="btn btn-outline btn-xs" onclick={() => (newTodoLinks = [])}>
				+ Todo
			</WriteButton>
		</div>
		<TodoList todos={openTodos.slice(0, TODOS_SHOWN)} empty="Nichts offen. 🎉" />
		{#if openTodos.length > TODOS_SHOWN}
			<a class="link link-hover text-sm text-base-content/60" href="/todos"
				>… und {openTodos.length - TODOS_SHOWN} weitere</a
			>
		{/if}
	</section>

	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))] gap-3">
		{#each planningState.phases as phase}
			{@const total = phase.conditions.length}
			{@const done = phase.conditions.filter((/** @type {any} */ c) => c.done).length}
			{@const complete = total > 0 && done === total}
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="flex items-start justify-between gap-2">
					<div class="flex flex-col items-start gap-1">
						<div class="font-semibold">{phase.title}</div>
						<div class="flex items-center gap-1">
							{#if todosPerPhase[phase.key]}
								<a
									class="badge badge-warning badge-sm"
									href="/todos?link={encodeURIComponent(
										linkParam({ kind: 'PHASE', key: phase.key })
									)}"
									title="offene Todos zu dieser Phase (auch zu ihren Schritten)"
									>{todosPerPhase[phase.key]} Todo{todosPerPhase[phase.key] === 1 ? '' : 's'}</a
								>
							{/if}
							<WriteButton
								class="btn btn-ghost btn-xs px-1 text-base-content/50"
								title="Todo zu dieser Phase anlegen"
								onclick={() =>
									(newTodoLinks = [{ kind: 'PHASE', key: phase.key, label: phase.title }])}
								>+ Todo</WriteButton
							>
						</div>
					</div>
					<!-- Fortschritts-Ring (Things3-Stil): füllt im Uhrzeigersinn; fertig = grün + Haken -->
					<div
						class="radial-progress shrink-0 text-xs font-semibold {complete
							? 'text-success'
							: 'text-primary'}"
						style="--value:{complete
							? 100
							: total
								? Math.round((done / total) * 100)
								: 0}; --size:2.4rem; --thickness:3px"
						role="progressbar"
						aria-valuenow={done}
						aria-valuemax={total}
						title="{done}/{total} erledigt"
					>
						{#if complete}
							<span class="text-base">✓</span>
						{:else}
							<span class="tabular-nums text-base-content/70">{done}/{total}</span>
						{/if}
					</div>
				</div>
				<div class="flex flex-col gap-1">
					{#each phase.conditions as cond}
						<label
							class="flex items-start gap-2 rounded p-1 {cond.auto
								? ''
								: 'cursor-pointer hover:bg-base-200'}"
							title={cond.auto
								? 'Dieser Status wird automatisch gesetzt und kann nicht manuell geändert werden'
								: undefined}
						>
							<!-- Auto-Bedingungen: normaler Haken, aber deaktiviert (Backend setzt sie automatisch) -->
							<input
								type="checkbox"
								class="checkbox checkbox-sm mt-0.5"
								checked={cond.done}
								disabled={cond.auto || busy.has(cond.key) || $page.data?.readOnly}
								onchange={() => toggle(cond)}
							/>
							<span
								class="flex-1 text-sm {cond.done ? 'text-base-content' : 'text-base-content/70'}"
							>
								{cond.title}
							</span>
							{#if cond.gate}
								<span
									class="text-base-content/40"
									title="Sperre: ist dies erledigt, wird die {cond.gate}-Generierung gesperrt"
								>
									🔒
								</span>
							{/if}
						</label>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<p class="max-w-3xl text-xs text-base-content/50">
		Manche Häkchen setzen sich beim Ausführen der Operationen (Generieren/Veröffentlichen)
		automatisch. „Veröffentlicht" bedeutet: die Veröffentlichungs-E-Mail wurde verschickt (nicht der
		ZPA-Upload). Für kleine Korrekturen nach der Veröffentlichung das Häkchen kurz lösen, neu
		generieren und wieder setzen.
	</p>
</div>

{#if newTodoLinks}
	<TodoEditor
		presetLinks={newTodoLinks}
		onclose={() => (newTodoLinks = null)}
		onsaved={async () => {
			newTodoLinks = null;
			await invalidateAll();
		}}
	/>
{/if}
