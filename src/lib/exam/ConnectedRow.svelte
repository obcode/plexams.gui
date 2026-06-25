<script>
	// Eine ZPA↔Primuss-Zuordnung als Zeile. `exam` trägt zusätzlich `.level`.
	import { LEVEL, warningsOf } from '$lib/exam/connected.js';

	/** @type {any} */
	export let exam;

	$: lvl = LEVEL[exam.level];
	$: errs = warningsOf(exam, 'error');
	$: warns = warningsOf(exam, 'warning');
	$: infos = warningsOf(exam, 'info');
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
	<div class="flex flex-col gap-1">
		{#each exam.primussExams ?? [] as p}
			<div class="flex flex-wrap items-baseline gap-x-2 text-sm">
				<span class="badge badge-neutral badge-sm">{p.program}</span>
				<span class="font-mono tabular-nums text-base-content/50">{p.ancode}</span>
				<span>{p.module}</span>
				<span class="text-base-content/50">· {p.mainExamer}</span>
			</div>
		{:else}
			<div class="text-sm font-medium text-error">— keine Primuss-Prüfung zugeordnet</div>
		{/each}

		{#if (exam.otherPrimussExams ?? []).length}
			<div class="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-base-content/50">
				<span>gleiche Nummer auch in:</span>
				{#each exam.otherPrimussExams as o}
					<span class="badge badge-outline badge-xs">{o.program}/{o.ancode}</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- echte Probleme prominent, über die volle Breite -->
	{#if errs.length || warns.length}
		<div class="flex flex-col gap-1 md:col-span-2">
			{#each errs as w}
				<div class="alert alert-error py-1.5 text-sm"><span>{w.message}</span></div>
			{/each}
			{#each warns as w}
				<div class="alert alert-warning py-1.5 text-sm"><span>{w.message}</span></div>
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
					<li>{w.message}</li>
				{/each}
			</ul>
		</details>
	{/if}
</div>
