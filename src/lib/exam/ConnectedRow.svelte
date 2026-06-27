<script>
	// Eine ZPA↔Primuss-Zuordnung als Zeile. `exam` trägt zusätzlich `.level`.
	// Aktionen (add/remove/fix) liefern das aktualisierte ConnectedExam,
	// das per `updated`-Event nach oben gereicht und im State ersetzt wird.
	import { createEventDispatcher } from 'svelte';
	import { LEVEL, warningsOf } from '$lib/exam/connected.js';
	import WriteButton from '$lib/WriteButton.svelte';

	/** @type {any} */
	export let exam;
	/** @type {Record<string, {ancode:number, module:string, mainExamer:string}[]>} */
	export let primussByProgram = {};

	const dispatch = createEventDispatcher();

	$: programOptions = Object.keys(primussByProgram).sort((a, b) => a.localeCompare(b));
	let addProgram = '';
	/** @type {number | string} */
	let addAncode = '';

	$: lvl = LEVEL[exam.level];
	$: errs = warningsOf(exam, 'error');
	$: warns = warningsOf(exam, 'warning');
	$: infos = warningsOf(exam, 'info');
	$: connectedProgs = new Set((exam.primussExams ?? []).map((/** @type {any} */ p) => p.program));

	let editing = false;
	let busy = false;
	let actionError = '';
	/** @type {Record<string, number>} Zielnummer je Studiengang fürs Umnummerieren */
	let fixTo = {};

	function startEdit() {
		fixTo = Object.fromEntries(
			(exam.primussExams ?? []).map((/** @type {any} */ p) => [p.program, p.ancode])
		);
		actionError = '';
		editing = true;
	}

	/** @param {string} path @param {any} body */
	async function call(path, body) {
		if (busy) return;
		busy = true;
		actionError = '';
		try {
			const res = await fetch(`/api/${path}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ zpaAncode: exam.zpaExam.ancode, ...body })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				actionError = result?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			dispatch('updated', result[path]);
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	/** @param {string} program @param {number} primussAncode */
	const add = (program, primussAncode) => call('addPrimussAncode', { program, primussAncode });
	/** @param {string} program */
	const remove = (program) => call('removePrimussAncode', { program });
	/** @param {string} program @param {number} fromAncode @param {number} toAncode */
	const fix = (program, fromAncode, toAncode) =>
		call('fixPrimussAncode', { program, fromAncode, toAncode });

	async function manualAdd() {
		if (!addProgram || !addAncode) return;
		await add(addProgram, Number(addAncode));
		if (!actionError) {
			addProgram = '';
			addAncode = '';
		}
	}
</script>

<div
	class="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border border-l-4 border-base-200 {lvl.border} {lvl.tint} p-3 md:grid-cols-2"
>
	<!-- ZPA (Grundlage) -->
	<div class="flex gap-2">
		<span class="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full {lvl.dot}" title={exam.level}
		></span>
		<div class="min-w-0">
			<div class="flex flex-wrap items-baseline gap-x-2">
				<span
					class="font-mono text-lg font-semibold tabular-nums"
					class:text-warning={exam.zpaExam.ancode >= 1000}
					title={exam.zpaExam.ancode >= 1000 ? 'Ancode ≥ 1000' : ''}
				>
					{exam.zpaExam.ancode}
				</span>
				<span class="font-medium">{exam.zpaExam.module}</span>
			</div>
			<div class="text-sm text-base-content/70">{exam.zpaExam.mainExamer}</div>
			{#if (exam.zpaExam.groups ?? []).length}
				<div class="mt-1 flex flex-wrap gap-1">
					{#each exam.zpaExam.groups as group}
						<span class="badge badge-ghost badge-xs">{group}</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Primuss (Anmeldedaten, vom Server zugeordnet) -->
	<div class="flex min-w-0 flex-col gap-1">
		<div class="flex items-start justify-between gap-2">
			<div class="flex min-w-0 flex-col gap-1">
				{#each exam.primussExams ?? [] as p}
					<div class="flex flex-wrap items-center gap-x-2 text-sm">
						<span class="badge badge-neutral badge-sm">{p.program}</span>
						{#if editing}
							<input
								type="number"
								class="input input-bordered input-xs w-20 tabular-nums"
								bind:value={fixTo[p.program]}
							/>
							<WriteButton
								class="btn btn-ghost btn-xs"
								disabled={busy || Number(fixTo[p.program]) === p.ancode}
								title="umnummerieren {p.ancode} → {fixTo[p.program]}"
								on:click={() => fix(p.program, p.ancode, Number(fixTo[p.program]))}
							>
								↻ Nr.
							</WriteButton>
							<WriteButton
								class="btn btn-ghost btn-xs text-error"
								disabled={busy}
								title="entfernen"
								on:click={() => remove(p.program)}
							>
								✕
							</WriteButton>
						{:else}
							<span class="font-mono tabular-nums text-base-content/50">{p.ancode}</span>
						{/if}
						<span>{p.module}</span>
						<span class="text-base-content/50">· {p.mainExamer}</span>
					</div>
				{:else}
					<div class="text-sm font-medium text-error">— keine Primuss-Prüfung zugeordnet</div>
				{/each}
			</div>

			<!-- Zeilen-Aktionen -->
			<div class="flex shrink-0 items-center gap-1">
				{#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
				<button
					class="btn btn-ghost btn-xs"
					class:btn-active={editing}
					on:click={() => (editing ? (editing = false) : startEdit())}
				>
					{editing ? 'fertig' : '✎ bearbeiten'}
				</button>
			</div>
		</div>

		{#if (exam.otherPrimussExams ?? []).length}
			<div class="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-base-content/50">
				<span>gleiche Nummer auch in:</span>
				{#each exam.otherPrimussExams as o}
					<span class="badge badge-outline badge-xs">{o.program}/{o.ancode}</span>
					{#if editing && !connectedProgs.has(o.program)}
						<WriteButton
							class="btn btn-ghost btn-xs"
							disabled={busy}
							title="{o.program}/{o.ancode} hinzufügen"
							on:click={() => add(o.program, o.ancode)}
						>
							＋
						</WriteButton>
					{/if}
				{/each}
			</div>
		{/if}

		{#if editing}
			<!-- beliebiges Primuss-Exam zuordnen (Auswahl aus den Primuss-Daten) -->
			<div class="mt-1 flex flex-wrap items-center gap-1">
				<select
					class="select select-bordered select-xs w-24"
					bind:value={addProgram}
					on:change={() => (addAncode = '')}
				>
					<option value="">Studiengang</option>
					{#each programOptions as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
				<select
					class="select select-bordered select-xs w-72"
					bind:value={addAncode}
					disabled={!addProgram}
				>
					<option value="">Ancode wählen …</option>
					{#each primussByProgram[addProgram] ?? [] as e}
						<option value={e.ancode}>{e.ancode} — {e.module} ({e.mainExamer})</option>
					{/each}
				</select>
				<WriteButton
					class="btn btn-xs"
					disabled={busy || !addProgram || !addAncode}
					on:click={manualAdd}
				>
					＋ hinzufügen
				</WriteButton>
			</div>
		{/if}
	</div>

	{#if actionError}
		<div class="alert alert-error py-1.5 text-sm md:col-span-2"><span>{actionError}</span></div>
	{/if}

	<!-- echte Probleme prominent, über die volle Breite -->
	{#if errs.length || warns.length}
		<div class="flex flex-col gap-1 md:col-span-2">
			{#each [...errs, ...warns] as w}
				<div
					class="alert {w.level === 'error'
						? 'alert-error'
						: 'alert-warning'} flex-wrap gap-2 py-1.5 text-sm"
				>
					<span>{w.message}</span>
					{#if w.program && w.ancode != null && !connectedProgs.has(w.program)}
						<WriteButton class="btn btn-xs" disabled={busy} on:click={() => add(w.program, w.ancode)}>
							＋ {w.program}/{w.ancode} hinzufügen
						</WriteButton>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Hinweise (Schreibweise etc.) dezent & ausklappbar -->
	{#if infos.length}
		<details class="md:col-span-2">
			<summary
				class="cursor-pointer list-none text-xs text-base-content/50 hover:text-base-content/70"
			>
				ℹ {infos.length} Hinweis{infos.length === 1 ? '' : 'e'} (Schreibweise, nicht gefunden …)
			</summary>
			<ul
				class="mt-1 ml-1 flex list-inside list-disc flex-col gap-0.5 text-xs text-base-content/50"
			>
				{#each infos as w}
					<li class="flex flex-wrap items-center gap-2">
						<span>{w.message}</span>
						{#if w.program && w.ancode != null && !connectedProgs.has(w.program)}
							<WriteButton
								class="btn btn-ghost btn-xs"
								disabled={busy}
								title="{w.program}/{w.ancode} hinzufügen"
								on:click={() => add(w.program, w.ancode)}
							>
								＋ hinzufügen
							</WriteButton>
						{/if}
					</li>
				{/each}
			</ul>
		</details>
	{/if}
</div>
