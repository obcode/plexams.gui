<script>
	import { mkStarttime } from '$lib/jshelper/misc.js';
	import { slide } from 'svelte/transition';
	import EmailSender from '$lib/email/EmailSender.svelte';

	// Karte eines/r NTA-Studierenden mit den Anmeldungen im aktuellen Semester
	// (angereichert um Raum/Zeit/Aufsicht in der load-Funktion der Seite).
	
	/**
	 * @typedef {Object} Props
	 * @property {any} nta
	 */

	/** @type {Props} */
	let { nta } = $props();

	let showFullComp = $state(false);
	let showOther = $state(false);
	let showMail = $state(false);

	let comp = $derived(nta.nta.compensation ?? '');
	let longComp = $derived(comp.length > 70);
	let compShort = $derived(longComp ? comp.slice(0, 70).trimEnd() + '…' : comp);

	let plannedExams = $derived(nta.exams.filter(
		(/** @type {any} */ e) => !(e.constraints && e.constraints.notPlannedByMe)
	));
	let otherExams = $derived(nta.exams.filter(
		(/** @type {any} */ e) => e.constraints && e.constraints.notPlannedByMe
	));
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
			{#if nta.nta.deltaDurationPercent}
				<span class="badge badge-primary">+{nta.nta.deltaDurationPercent}% Zeit</span>
			{/if}
			{#if nta.nta.needsRoomAlone}
				<span class="badge badge-warning badge-sm">eigener Raum</span>
			{/if}
			{#if nta.nta.needsHardware}
				<span class="badge badge-info badge-sm">Hardware</span>
			{/if}
		</div>
	</div>

	<!-- Kompensation (gekürzt mit „mehr") -->
	{#if comp}
		<div class="text-sm">
			{showFullComp || !longComp ? comp : compShort}
			{#if longComp}
				<button
					class="align-baseline text-xs font-medium text-primary"
					onclick={() => (showFullComp = !showFullComp)}
				>
					{showFullComp ? 'weniger' : 'mehr'}
				</button>
			{/if}
		</div>
	{/if}
	{#if nta.nta.until}
		<div class="-mt-1 text-xs text-base-content/50">gültig bis {nta.nta.until}</div>
	{/if}

	<!-- Von mir geplante Prüfungen -->
	{#if plannedExams.length}
		<div class="flex flex-col gap-1.5">
			{#each plannedExams as exam}
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
			{/each}
		</div>
	{/if}

	<!-- Nicht von mir geplante Prüfungen (eingeklappt) -->
	{#if otherExams.length}
		<div>
			<button
				class="btn btn-ghost btn-xs gap-1 px-1 text-base-content/60"
				onclick={() => (showOther = !showOther)}
			>
				{showOther ? '▾' : '▸'}
				{otherExams.length} nicht von mir geplante {otherExams.length === 1
					? 'Prüfung'
					: 'Prüfungen'}
			</button>
			{#if showOther}
				<div class="mt-1 flex flex-col gap-1.5" transition:slide>
					{#each otherExams as exam}
						<div
							class="rounded border border-base-300 bg-base-200/40 px-3 py-1.5 text-sm text-base-content/40"
						>
							{exam.ancode}. {exam.zpaExam.mainExamer}: {exam.zpaExam.module}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Einzelversand: dezenter Button öffnet ein Modal -->
	<div>
		<button
			class="btn btn-ghost btn-xs gap-1 px-1 text-base-content/60"
			onclick={() => (showMail = true)}
		>
			✉ E-Mail versenden
		</button>
	</div>
</div>

{#if showMail}
	<div class="modal modal-open">
		<div class="modal-box flex max-w-lg flex-col gap-3">
			<h3 class="text-lg font-semibold">E-Mail an {nta.nta.name}</h3>
			<EmailSender
				emailKey="sendEmailNewNTA"
				title="„Neuer NTA“ an Prüfende"
				description="Info an die betroffenen Prüfenden über den neuen NTA-Bescheid von {nta.nta.name}."
				extraArgs={{ mtknr: { type: 'String!', value: nta.nta.mtknr } }}
			/>
			{#if nta.nta.needsRoomAlone}
				<EmailSender
					emailKey="sendEmailNTARoomAlone"
					title="Einzelraum-Info senden"
					description="Info zum eigenen Raum für {nta.nta.name}."
					extraArgs={{ mtknr: { type: 'String!', value: nta.nta.mtknr } }}
				/>
			{/if}
			<div class="flex justify-end">
				<button class="btn btn-ghost btn-sm" onclick={() => (showMail = false)}>Schließen</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="Schließen" onclick={() => (showMail = false)}
		></button>
	</div>
{/if}
