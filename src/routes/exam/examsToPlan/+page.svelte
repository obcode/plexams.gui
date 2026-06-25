<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ConstraintsModal from '$lib/exam/ConstraintsModal.svelte';

	export let data;

	// lokaler State (optimistisches Umschalten ohne Voll-Reload)
	/** @type {any[]} */
	let items = [];
	/** @type {any} */
	let lastData;
	$: if (data.items !== lastData) {
		items = data.items.map((/** @type {any} */ e) => ({ ...e }));
		lastData = data.items;
	}

	/** @type {Set<number>} */
	let busy = new Set();
	let actionError = '';

	$: counts = {
		total: items.length,
		toPlan: items.filter((/** @type {any} */ e) => e.status === 'toPlan').length,
		notToPlan: items.filter((/** @type {any} */ e) => e.status === 'notToPlan').length,
		unknown: items.filter((/** @type {any} */ e) => e.status === 'unknown').length
	};

	// --- Constraints-Helfer ---
	/** @param {any} rc */
	const roomSet = (rc) =>
		!!rc &&
		(rc.exahm ||
			rc.seb ||
			rc.lab ||
			rc.placesWithSocket ||
			(rc.allowedRooms ?? []).length ||
			rc.maxStudents ||
			rc.comments ||
			rc.kdpJiraURL);
	/** @param {any} c */
	const hasConstraints = (c) =>
		!!c &&
		(c.notPlannedByMe ||
			c.online ||
			(c.excludeDays ?? []).length ||
			(c.possibleDays ?? []).length ||
			(c.sameSlot ?? []).length ||
			roomSet(c.roomConstraints));
	/** @param {string} iso */
	const day = (iso) => (iso ?? '').slice(0, 10);

	// --- Filter ---
	// Status: beim Laden nur „zu planen"
	/** @type {string | null} */
	let filterStatus = 'toPlan';
	let cFilter = 'alle';
	let q = '';
	const setStatusFilter = (/** @type {string} */ s) =>
		(filterStatus = filterStatus === s ? null : s);

	/** @param {any} e */
	function passesConstraint(e) {
		const c = e.constraints;
		const rc = c?.roomConstraints;
		switch (cFilter) {
			case 'mit':
				return hasConstraints(c) && !c.notPlannedByMe;
			case 'ohne':
				return !hasConstraints(c);
			case 'exahm':
				return !!rc?.exahm;
			case 'seb':
				return !!rc?.seb;
			case 'lab':
				return !!rc?.lab;
			case 'socket':
				return !!rc?.placesWithSocket;
			case 'notme':
				return !!c?.notPlannedByMe;
			default:
				return true;
		}
	}

	$: filtered = items.filter((/** @type {any} */ e) => {
		if (filterStatus && e.status !== filterStatus) return false;
		if (cFilter !== 'alle' && !passesConstraint(e)) return false;
		if (q.trim()) {
			const n = q.trim().toLowerCase();
			const hay =
				`${e.ancode} ${e.module} ${e.mainExamer} ${e.examTypeFull} ` + (e.groups ?? []).join(' ');
			if (!hay.toLowerCase().includes(n)) return false;
		}
		return true;
	});

	/** @param {any} item @param {'toPlan'|'notToPlan'} target */
	async function setStatus(item, target) {
		if (item.status === target || busy.has(item.ancode)) return;
		const prev = item.status;
		item.status = target;
		items = items;
		busy = new Set(busy).add(item.ancode);
		actionError = '';
		try {
			const path = target === 'toPlan' ? 'addToPlan' : 'rmFromPlan';
			const res = await fetch(`/api/zpaexams/${path}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: item.ancode })
			});
			if (!res.ok) throw new Error(`Fehler (HTTP ${res.status})`);
		} catch (e) {
			item.status = prev;
			items = items;
			actionError = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(busy);
			s.delete(item.ancode);
			busy = s;
		}
	}

	// --- Constraints-Editor (Modal) ---
	/** @type {any} */
	let editExam = null;
	/** @param {any} e */
	const openEdit = (e) => (editExam = e);
	/** @param {CustomEvent<any>} ev */
	function onSaved(ev) {
		const nc = ev.detail;
		const it = items.find((/** @type {any} */ e) => e.ancode === nc.ancode);
		if (it) {
			it.constraints = nc;
			items = items;
		}
		editExam = null;
	}

	onMount(() => {
		const a = Number($page.url.searchParams.get('ancode'));
		if (a) {
			const it = items.find((/** @type {any} */ e) => e.ancode === a);
			if (it) {
				filterStatus = null;
				editExam = it;
			}
		}
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">ZPA-Prüfungen planen</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{counts.total}</span>
	</div>

	<!-- Banner: nicht zugeordnete Prüfungen -->
	{#if counts.unknown > 0}
		<div class="alert alert-warning">
			<span>
				<strong>{counts.unknown}</strong> Prüfung{counts.unknown === 1 ? '' : 'en'} noch
				<strong>nicht zugeordnet</strong> — bitte entscheiden: planen oder nicht planen.
			</span>
			<button class="btn btn-sm" on:click={() => (filterStatus = 'unknown')}>anzeigen</button>
		</div>
	{/if}

	{#if actionError}
		<div class="alert alert-error py-2 text-sm"><span>{actionError}</span></div>
	{/if}

	<!-- Filter -->
	<div class="flex flex-wrap items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="flex flex-wrap items-center gap-1.5">
			<button
				class="badge badge-success gap-1 tabular-nums {filterStatus && filterStatus !== 'toPlan'
					? 'opacity-40'
					: ''}"
				on:click={() => setStatusFilter('toPlan')}
			>
				✓ {counts.toPlan} zu planen
			</button>
			<button
				class="badge badge-ghost gap-1 tabular-nums {filterStatus && filterStatus !== 'notToPlan'
					? 'opacity-40'
					: ''}"
				on:click={() => setStatusFilter('notToPlan')}
			>
				✕ {counts.notToPlan} nicht planen
			</button>
			<button
				class="badge badge-warning gap-1 tabular-nums {filterStatus && filterStatus !== 'unknown'
					? 'opacity-40'
					: ''}"
				on:click={() => setStatusFilter('unknown')}
			>
				? {counts.unknown} nicht zugeordnet
			</button>
		</div>
		<div class="flex-1"></div>
		<label class="flex items-center gap-1 text-sm">
			<span class="text-base-content/50">Constraints</span>
			<select class="select select-bordered select-sm" bind:value={cFilter}>
				<option value="alle">alle</option>
				<option value="mit">mit Constraints</option>
				<option value="ohne">ohne Constraints</option>
				<option value="exahm">EXaHM</option>
				<option value="seb">SEB</option>
				<option value="lab">Labor</option>
				<option value="socket">Steckdosen</option>
				<option value="notme">nicht von mir geplant</option>
			</select>
		</label>
		<input
			class="input input-bordered input-sm w-56"
			type="text"
			bind:value={q}
			placeholder="Ancode, Modul, Prüfer:in, Gruppe …"
		/>
	</div>

	<!-- Liste -->
	<div class="flex flex-col gap-1.5">
		{#each filtered as e (e.ancode)}
			<div
				class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-l-4 border-base-200 p-3 {e.status ===
				'unknown'
					? 'border-l-warning bg-warning/5'
					: e.status === 'toPlan'
						? 'border-l-success/40'
						: 'border-l-base-300 opacity-60'}"
			>
				<!-- Status -->
				<div class="flex w-40 shrink-0 items-center gap-2">
					{#if e.status === 'unknown'}
						<button
							class="btn btn-success btn-xs"
							disabled={busy.has(e.ancode)}
							on:click={() => setStatus(e, 'toPlan')}>planen</button
						>
						<button
							class="btn btn-error btn-xs"
							disabled={busy.has(e.ancode)}
							on:click={() => setStatus(e, 'notToPlan')}>nicht</button
						>
					{:else}
						<input
							type="checkbox"
							class="toggle toggle-success toggle-sm"
							checked={e.status === 'toPlan'}
							disabled={busy.has(e.ancode)}
							on:change={(ev) => setStatus(e, ev.currentTarget.checked ? 'toPlan' : 'notToPlan')}
						/>
						<span class="text-xs text-base-content/60">
							{e.status === 'toPlan' ? 'zu planen' : 'nicht planen'}
						</span>
					{/if}
				</div>

				<!-- Prüfung -->
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-baseline gap-x-2">
						<a
							class="link link-primary font-mono text-lg font-semibold tabular-nums"
							href="/exam/examWithRegs/{e.ancode}">{e.ancode}</a
						>
						<span class="font-medium">{e.module}</span>
						{#if e.isRepeaterExam}<span title="Wiederholungsprüfung">🔁</span>{/if}
					</div>
					<div class="text-sm text-base-content/70">
						{e.mainExamer} · <span class="text-base-content/50">{e.examTypeFull}</span>
					</div>
					<div class="mt-1 flex flex-wrap items-center gap-1">
						{#each e.groups ?? [] as g}
							<span class="badge badge-ghost badge-xs">{g}</span>
						{/each}
						{#each e.primussAncodes ?? [] as p}
							{#if p.ancode === -1 || p.ancode === 0}
								<span class="badge badge-error badge-xs">{p.program}/{p.ancode}</span>
							{:else if p.ancode === e.ancode}
								<span class="badge badge-outline badge-xs">{p.program}</span>
							{:else}
								<span class="badge badge-warning badge-xs">{p.program}/{p.ancode}</span>
							{/if}
						{/each}
					</div>
				</div>

				<!-- Constraints kompakt (nur bei „zu planen") -->
				{#if e.status === 'toPlan'}
					{@const c = e.constraints}
					<div class="flex w-72 shrink-0 flex-wrap items-center gap-1 self-stretch text-xs">
						{#if c?.notPlannedByMe}
							<span class="badge badge-neutral badge-sm">nicht von mir geplant</span>
						{:else}
							{#if c?.online}<span class="badge badge-warning badge-sm">Online</span>{/if}
							{#if c?.roomConstraints?.exahm}<span class="badge badge-error badge-sm">EXaHM</span
								>{/if}
							{#if c?.roomConstraints?.seb}<span class="badge badge-error badge-sm">SEB</span>{/if}
							{#if c?.roomConstraints?.lab}<span class="badge badge-error badge-sm">Labor</span
								>{/if}
							{#if c?.roomConstraints?.placesWithSocket}<span class="badge badge-sm"
									>Steckdosen</span
								>{/if}
							{#if (c?.excludeDays ?? []).length}<span
									class="badge badge-ghost badge-sm"
									title={c.excludeDays.map(day).join(', ')}>Sperrtage {c.excludeDays.length}</span
								>{/if}
							{#if (c?.possibleDays ?? []).length}<span
									class="badge badge-ghost badge-sm"
									title={c.possibleDays.map(day).join(', ')}>nur {c.possibleDays.length}</span
								>{/if}
							{#if (c?.sameSlot ?? []).length}<span
									class="badge badge-ghost badge-sm"
									title={c.sameSlot.join(', ')}>=Slot {c.sameSlot.length}</span
								>{/if}
							{#if c?.roomConstraints?.maxStudents}<span class="badge badge-ghost badge-sm"
									>max {c.roomConstraints.maxStudents}</span
								>{/if}
							{#if !hasConstraints(c)}<span class="text-base-content/30">keine</span>{/if}
						{/if}
						<button class="btn btn-ghost btn-xs ml-auto" on:click={() => openEdit(e)}>✎</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="p-6 text-center text-sm text-base-content/50">
				Keine Prüfungen entsprechen dem Filter.
			</div>
		{/each}
	</div>
</div>

{#if editExam}
	<ConstraintsModal
		exam={editExam}
		days={data.days}
		rooms={data.rooms}
		allExams={items}
		on:saved={onSaved}
		on:close={() => (editExam = null)}
	/>
{/if}
