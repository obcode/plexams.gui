<script>
	import { mkStarttime } from '$lib/jshelper/misc.js';

	// Karte eines/r NTA-Studierenden mit den Anmeldungen im aktuellen Semester
	// (angereichert um Raum/Zeit/Aufsicht in der load-Funktion der Seite).
	/** @type {any} */
	export let nta;
</script>

<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
	<!-- Kopf -->
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<div class="font-medium">{nta.nta.name}</div>
			<div class="text-xs text-base-content/50">
				{nta.nta.program} · <span class="font-mono">{nta.nta.mtknr}</span>
			</div>
			{#if nta.nta.email}
				<a class="link text-xs text-base-content/60" href="mailto:{nta.nta.email}">
					{nta.nta.email}
				</a>
			{/if}
		</div>
		<div class="flex shrink-0 flex-col items-end gap-1">
			{#if nta.nta.needsRoomAlone}
				<span class="badge badge-warning badge-sm">eigener Raum</span>
			{/if}
			{#if nta.nta.needsHardware}
				<span class="badge badge-info badge-sm">Hardware</span>
			{/if}
		</div>
	</div>

	<!-- Kompensation -->
	<div class="flex flex-wrap items-baseline gap-2 text-sm">
		<span>{nta.nta.compensation}</span>
		{#if nta.nta.until}
			<span class="text-xs text-base-content/50">gültig bis {nta.nta.until}</span>
		{/if}
	</div>

	<!-- Prüfungen -->
	<div class="flex flex-col gap-1.5">
		{#each nta.exams as exam}
			{#if exam.constraints && exam.constraints.notPlannedByMe}
				<div class="rounded border border-base-300 bg-base-200/40 px-3 py-1.5 text-sm text-base-content/40">
					{exam.ancode}. {exam.zpaExam.mainExamer}: {exam.zpaExam.module}
					<span class="text-xs">(nicht von mir geplant)</span>
				</div>
			{:else}
				<div class="rounded border border-base-300 px-3 py-1.5 text-sm">
					<div class="font-medium">
						{exam.ancode}. {exam.zpaExam.module}
						<span class="font-normal text-base-content/50">· {exam.zpaExam.mainExamer}</span>
					</div>
					<div class="mt-1 flex flex-wrap items-center gap-1.5">
						{#if exam.roomName}
							<span class="badge badge-success badge-sm">{exam.roomName}</span>
						{:else}
							<span class="badge badge-warning badge-sm">Raum offen</span>
						{/if}
						{#if exam.starttime}
							<span class="badge badge-ghost badge-sm">{mkStarttime(exam.starttime)}</span>
						{:else}
							<span class="badge badge-warning badge-sm">Termin offen</span>
						{/if}
						{#if exam.invigilator}
							<span class="badge badge-outline badge-sm">Aufsicht {exam.invigilator}</span>
						{/if}
						{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.seb}
							<span class="badge badge-error badge-sm">SEB</span>
						{/if}
						{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.exahm}
							<span class="badge badge-error badge-sm">EXaHM</span>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div>
