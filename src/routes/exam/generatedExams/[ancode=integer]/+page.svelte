<script>
	export let data;

	$: exam = data.generatedExam;
	$: studentCount = exam
		? exam.primussExams.reduce(
				(/** @type {number} */ sum, /** @type {any} */ pe) => sum + pe.studentRegs.length,
				0
			)
		: 0;
	$: c = exam?.constraints;

	const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	/** @param {string} iso → „Mo, 06.07." */
	const day = (iso) => {
		const p = (iso ?? '').slice(0, 10);
		const [y, m, d] = p.split('-').map(Number);
		if (!y) return p;
		const dt = new Date(Date.UTC(y, m - 1, d));
		return `${WD[dt.getUTCDay()]}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
	};
</script>

{#if exam}
	<div class="mx-2 mt-4 flex flex-col gap-4">
		<a href="/exam/generatedExams" class="link link-hover text-sm text-base-content/50">
			← alle generierten Prüfungen
		</a>

		<!-- Kopf -->
		<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex flex-wrap items-baseline gap-x-3">
				<span class="font-mono text-2xl font-bold tabular-nums">{exam.ancode}</span>
				<span class="text-xl font-semibold">{exam.zpaExam.module}</span>
				{#if exam.zpaExam.isRepeaterExam}<span title="Wiederholungsprüfung">🔁</span>{/if}
			</div>
			<div class="text-base-content/70">
				{exam.zpaExam.mainExamer} ·
				<span class="text-base-content/50">{exam.zpaExam.examTypeFull}</span>
				· <span class="tabular-nums">{exam.zpaExam.duration} min</span>
			</div>

			<div class="flex flex-wrap items-center gap-1">
				{#each exam.zpaExam.groups ?? [] as g}
					<span class="badge badge-ghost badge-xs">{g}</span>
				{/each}
				{#each exam.zpaExam.primussAncodes ?? [] as p}
					<span class="badge badge-outline badge-xs tabular-nums">{p.program}/{p.ancode}</span>
				{/each}
			</div>

			<div class="mt-1 flex flex-wrap items-center gap-1.5">
				<span class="badge badge-primary tabular-nums">{studentCount} Anmeldungen</span>
				{#if c?.notPlannedByMe}<span class="badge badge-neutral badge-sm"
						>nicht von mir geplant</span
					>{/if}
				{#if c?.online}<span class="badge badge-info badge-sm">Online</span>{/if}
				{#if c?.roomConstraints?.exahm}<span class="badge badge-error badge-sm">EXaHM</span>{/if}
				{#if c?.roomConstraints?.seb}<span class="badge badge-warning badge-sm">SEB</span>{/if}
				{#if c?.roomConstraints?.lab}<span class="badge badge-neutral badge-sm">Labor</span>{/if}
				{#if c?.roomConstraints?.placesWithSocket}<span class="badge badge-sm">Steckdosen</span
					>{/if}
				{#if (c?.excludeDays ?? []).length}<span class="badge badge-ghost badge-sm"
						>🚫 {c.excludeDays.map(day).join(', ')}</span
					>{/if}
				{#if (c?.possibleDays ?? []).length}<span class="badge badge-ghost badge-sm"
						>nur {c.possibleDays.map(day).join(', ')}</span
					>{/if}
				{#if (c?.sameSlot ?? []).length}<span class="badge badge-ghost badge-sm"
						>=Slot {c.sameSlot.join(', ')}</span
					>{/if}
			</div>
		</div>

		<!-- Konflikte -->
		{#if (exam.conflicts ?? []).length}
			<div class="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/5 p-3">
				<div class="text-sm font-medium">Konflikte ({exam.conflicts.length})</div>
				{#each exam.conflicts as cf}
					<div class="flex flex-wrap items-center gap-2 text-sm">
						<span class="font-mono tabular-nums">{cf.ancode}</span>
						<span class="badge badge-warning badge-sm tabular-nums"
							>{cf.numberOfStuds} gemeinsam</span
						>
						{#each cf.primussAncodes ?? [] as p}
							<span class="badge badge-ghost badge-xs tabular-nums">
								{p.program}/{p.ancode} ({p.numberOfStuds})
							</span>
						{/each}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Anmeldungen je Studiengang -->
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each exam.primussExams as pe}
				{@const ntaSet = new Set((pe.ntas ?? []).map((/** @type {any} */ n) => n.mtknr))}
				<div class="overflow-hidden rounded-lg border border-base-300 bg-base-100">
					<div class="flex items-center gap-2 border-b border-base-300 bg-base-200/50 px-3 py-2">
						<span class="badge badge-neutral badge-sm">{pe.exam.program}</span>
						<span class="truncate text-sm text-base-content/60" title={pe.exam.module}>
							{pe.exam.module}
						</span>
						<div class="flex-1"></div>
						{#if (pe.ntas ?? []).length}
							<span class="badge badge-info badge-sm tabular-nums">{pe.ntas.length} NTA</span>
						{/if}
						<span class="badge badge-ghost badge-sm tabular-nums">{pe.studentRegs.length}</span>
					</div>
					{#if pe.studentRegs.length}
						<ol class="flex flex-col">
							{#each pe.studentRegs as s, i}
								<li
									class="flex items-baseline gap-2 px-3 py-1 text-sm {i % 2
										? 'bg-base-200/30'
										: ''}"
								>
									<span class="w-6 shrink-0 text-right tabular-nums text-base-content/30">
										{i + 1}
									</span>
									<span class="min-w-0">
										<span>{s.name}</span>
										{#if ntaSet.has(s.mtknr)}<span class="badge badge-info badge-xs ml-1">NTA</span
											>{/if}
										{#if s.zpaStudent?.email}
											<span class="text-xs text-base-content/40">· {s.zpaStudent.email}</span>
										{/if}
									</span>
								</li>
							{/each}
						</ol>
					{:else}
						<div class="px-3 py-3 text-sm text-base-content/40">keine Anmeldungen</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div class="mx-2 mt-10 flex justify-center">
		<div class="alert alert-error max-w-md">
			<span>❌ Prüfung nicht in Planung.</span>
		</div>
	</div>
{/if}
