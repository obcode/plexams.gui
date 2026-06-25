<script>
	import { levelOf } from '$lib/exam/connected.js';
	import ConnectedRow from '$lib/exam/ConnectedRow.svelte';

	export let data;

	$: rows = (data.connectedExams ?? []).map((/** @type {any} */ e) => ({
		...e,
		level: levelOf(e)
	}));

	$: counts = {
		total: rows.length,
		error: rows.filter((/** @type {any} */ r) => r.level === 'error').length,
		warning: rows.filter((/** @type {any} */ r) => r.level === 'warning').length,
		info: rows.filter((/** @type {any} */ r) => r.level === 'info').length,
		ok: rows.filter((/** @type {any} */ r) => r.level === 'ok').length
	};

	// Filter: null = alle, 'attention' = Warnungen+Fehler, sonst genau eine Stufe.
	/** @type {string | null} */
	let filter = null;
	let q = '';

	/** @param {string} f */
	const toggle = (f) => (filter = filter === f ? null : f);

	/** @param {any} r */
	function passesFilter(r) {
		if (filter === 'attention') return r.level === 'warning' || r.level === 'error';
		if (filter) return r.level === filter;
		return true;
	}

	$: filtered = rows.filter((/** @type {any} */ r) => {
		if (!passesFilter(r)) return false;
		if (q.trim()) {
			const n = q.trim().toLowerCase();
			const hay =
				`${r.zpaExam.ancode} ${r.zpaExam.module} ${r.zpaExam.mainExamer} ` +
				(r.primussExams ?? [])
					.map((/** @type {any} */ p) => `${p.program} ${p.mainExamer}`)
					.join(' ');
			if (!hay.toLowerCase().includes(n)) return false;
		}
		return true;
	});

	/** @param {string} f → Badge ausgegraut, wenn ein anderer Filter aktiv ist */
	const dim = (f) => (filter && filter !== f ? 'opacity-40' : '');
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Zuordnung ZPA ↔ Primuss</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{counts.total}</span>
		<span class="text-sm text-base-content/50">ZPA-Prüfungen</span>
	</div>

	{#if data.loadError}
		<div class="alert alert-error">
			<span>
				Die Zuordnung konnte nicht geladen werden (Backend-Fehler):
				<span class="font-mono text-xs">{data.loadError}</span>
			</span>
		</div>
	{:else}
		<!-- Übersicht: Badges sind Filter (anklicken = nur diese Stufe) -->
		<div
			class="flex flex-wrap items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-3"
		>
			<div class="flex flex-wrap items-center gap-1.5">
				<button
					class="badge badge-success gap-1 tabular-nums {dim('ok')}"
					on:click={() => toggle('ok')}
				>
					✓ {counts.ok} passt
				</button>
				<button
					class="badge badge-ghost gap-1 tabular-nums {dim('info')}"
					on:click={() => toggle('info')}
				>
					ℹ {counts.info} Hinweise
				</button>
				<button
					class="badge badge-warning gap-1 tabular-nums {dim('warning')}"
					on:click={() => toggle('warning')}
				>
					⚠ {counts.warning} Warnungen
				</button>
				<button
					class="badge badge-error gap-1 tabular-nums {dim('error')}"
					on:click={() => toggle('error')}
				>
					✕ {counts.error} Fehler
				</button>
			</div>
			<div class="flex-1"></div>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input
					type="checkbox"
					class="toggle toggle-sm"
					checked={filter === 'attention'}
					on:change={() => toggle('attention')}
				/>
				<span>nur Auffälligkeiten</span>
			</label>
			<input
				class="input input-bordered input-sm w-56"
				type="text"
				bind:value={q}
				placeholder="Ancode, Modul, Prüfer:in …"
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			{#each filtered as exam (exam.zpaExam.ancode)}
				<ConnectedRow {exam} />
			{:else}
				<div class="p-6 text-center text-sm text-base-content/50">
					Keine Prüfungen entsprechen dem Filter.
				</div>
			{/each}
		</div>
	{/if}
</div>
