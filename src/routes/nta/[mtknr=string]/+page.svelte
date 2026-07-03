<script lang="ts">
	let { data } = $props();
	let nta = $derived(data.nta);
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<a href="/nta/all" class="text-sm text-base-content/60 hover:underline">← NTA-Stammdaten</a>

	{#if data.nta == null}
		<div class="alert alert-warning"><span>Kein NTA mit dieser Matrikelnummer gefunden.</span></div>
	{:else}
		<div class="flex flex-col gap-4 rounded-lg border border-base-300 bg-base-100 p-4">
			<!-- Kopf -->
			<div class="flex flex-wrap items-start justify-between gap-2">
				<div class="min-w-0">
					<h1 class="text-2xl font-semibold">{nta.nta.name}</h1>
					<div class="text-sm text-base-content/50">
						{nta.nta.program} · <span class="font-mono">{nta.nta.mtknr}</span>
						{#if nta.nta.email}
							· <a class="link" href="mailto:{nta.nta.email}">{nta.nta.email}</a>
						{/if}
					</div>
				</div>
				<div class="flex shrink-0 flex-wrap items-center gap-1">
					{#if nta.nta.deactivated}
						<span class="badge badge-error">inaktiv</span>
					{:else}
						<span class="badge badge-success">aktiv</span>
					{/if}
					{#if nta.nta.needsRoomAlone}
						<span class="badge badge-warning badge-sm">eigener Raum</span>
					{/if}
					{#if nta.nta.needsHardware}
						<span class="badge badge-info badge-sm">Hardware</span>
					{/if}
				</div>
			</div>

			<!-- Eckdaten -->
			<div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
				<span class="text-base-content/60">Verlängerung</span>
				<span class="tabular-nums">{nta.nta.deltaDurationPercent} %</span>
				<span class="text-base-content/60">Bescheid von</span>
				<span>{nta.nta.from || '—'}</span>
				<span class="text-base-content/60">gültig bis</span>
				<span>{nta.nta.until || '—'}</span>
				<span class="text-base-content/60">zuletzt</span>
				<span>{nta.nta.lastSemester || '—'}</span>
			</div>

			<!-- Kompensation -->
			<div>
				<div class="text-xs font-medium text-base-content/60">Kompensation</div>
				<div class="text-sm">{nta.nta.compensation}</div>
			</div>
		</div>

		<!-- Anmeldungen -->
		<div class="flex flex-col gap-2">
			<h2 class="text-lg font-semibold text-base-content/80">Anmeldungen</h2>
			{#if nta.exams && nta.exams.length}
				<div class="flex flex-col gap-1.5">
					{#each nta.exams as exam}
						<div class="rounded border border-base-300 bg-base-100 px-3 py-1.5 text-sm">
							<span class="font-medium">{exam.ancode}. {exam.module}</span>
							<span class="text-base-content/50">
								· {exam.mainExamer}{#if exam.examTypeFull} · {exam.examTypeFull}{/if}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-sm text-base-content/50">Keine Anmeldungen im aktuellen Semester.</div>
			{/if}
		</div>
	{/if}
</div>
