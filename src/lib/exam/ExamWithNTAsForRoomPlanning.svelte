<script>
	import { classifyRoom } from '$lib/room/roomCategories';

	/** @type {any} */
	export let plannedExam;
	export let showOnlyExamsWithNTAs;
	export let details;
	export let showRooms;
	/** bei Raumauswahl: andere Räume/Prüfungen gedimmt mit anzeigen */
	export let dimOthers = false;

	let exam = plannedExam.zpaExam;
	let constraints = plannedExam.constraints;
	let ntas = plannedExam.ntas;

	// enthält diese Prüfung den ausgewählten Raum?
	$: matchesRoom =
		showRooms === 'all' ||
		(plannedExam.plannedRooms || []).some((/** @type {any} */ r) => r.room.name === showRooms);
	$: passNta = !showOnlyExamsWithNTAs || (ntas && ntas.length > 0);
	// sichtbar: bei Raumauswahl ohne Treffer nur, wenn „andere gedimmt" aktiv
	$: visible = passNta && (showRooms === 'all' || matchesRoom || dimOthers);
	// ganze Karte dimmen, wenn sie den ausgewählten Raum nicht enthält
	$: dimmed = showRooms !== 'all' && !matchesRoom;

	$: hasNtas = ntas && ntas.length > 0;

	let studentRegs = plannedExam.studentRegsCount;

	let studentsInRoom = 0;
	if (plannedExam.plannedRooms) {
		for (const room of plannedExam.plannedRooms) {
			if (room.roomName != 'No Room') studentsInRoom += room.studentsInRoom.length;
		}
	}
	let studentRegsWithoutRoom = studentRegs - studentsInRoom;

	const exahm = constraints?.roomConstraints?.exahm;
	const seb = constraints?.roomConstraints?.seb;
	const placesWithSocket = constraints?.roomConstraints?.placesWithSocket;
	const lab = constraints?.roomConstraints?.lab;

	/** @param {any} exam @param {string} mtknr */
	function ntaName(exam, mtknr) {
		for (const nta of exam.ntas) {
			if (nta.mtknr == mtknr) return nta.name;
		}
	}

	/** @param {number} ancode @param {any} room */
	async function prePlanRoom(ancode, room) {
		const roomName = room.room.name;
		const reserve = room.reserve;
		const mtknr = room.ntaMtknr;
		room.prePlanned = true;
		plannedExam = plannedExam; // Reaktivität anstoßen
		await fetch('/api/prePlanRoom', {
			method: 'POST',
			body: JSON.stringify({ ancode, roomName, reserve, mtknr }),
			headers: { 'content-type': 'application/json' }
		});
	}

	/** aus der Vorplanung entfernen (mtknr leer = Raum der normalen Studierenden,
	 * mtknr gesetzt = NTA-Raum). @param {number} ancode @param {any} room */
	async function removePrePlan(ancode, room) {
		const roomName = room.room.name;
		const mtknr = room.ntaMtknr;
		room.prePlanned = false;
		plannedExam = plannedExam;
		await fetch('/api/removePrePlannedRoom', {
			method: 'POST',
			body: JSON.stringify({ ancode, roomName, mtknr }),
			headers: { 'content-type': 'application/json' }
		});
	}
</script>

{#if visible}
	<div
		class="flex w-72 flex-col gap-2 rounded-lg border bg-base-100 p-3 {hasNtas
			? 'border-warning/50'
			: 'border-base-300'} {dimmed ? 'opacity-40' : ''}"
	>
		<!-- Raum-Constraints -->
		{#if exahm || seb || placesWithSocket || lab}
			<div class="flex flex-wrap gap-1">
				{#if exahm}<span class="badge badge-info badge-sm">EXaHM</span>{/if}
				{#if seb}<span class="badge badge-error badge-sm">SEB</span>{/if}
				{#if placesWithSocket}<span class="badge badge-warning badge-sm">Steckdosen</span>{/if}
				{#if lab}<span class="badge badge-warning badge-sm">Labor</span>{/if}
			</div>
		{/if}

		<!-- Prüfung -->
		<div class="text-sm font-medium">
			{exam.ancode}. {exam.module}
			<span class="font-normal text-base-content/50">· {exam.mainExamer}</span>
		</div>

		<!-- Kennzahlen -->
		<div class="flex flex-wrap items-center gap-1 text-xs">
			<span class="badge badge-success badge-sm">{studentRegs} Stud.</span>
			{#if studentRegsWithoutRoom > 0}
				<span class="badge badge-error badge-sm">{studentRegsWithoutRoom} ohne Raum</span>
			{/if}
			<span class="badge badge-ghost badge-sm">{exam.duration} Min.</span>
		</div>

		<!-- Geplante Räume -->
		{#if plannedExam.plannedRooms && plannedExam.plannedRooms.length}
			<div class="flex flex-col gap-1">
				{#each plannedExam.plannedRooms as room}
					<div
						class="flex items-center gap-2 rounded-lg border px-2 py-1 text-sm {classifyRoom(room)
							.chip} {room.handicap ? 'border-dashed' : ''} {showRooms !== 'all' &&
						!dimmed &&
						room.room.name !== showRooms
							? 'opacity-40'
							: ''}"
					>
						{#if room.prePlanned}
							<span title="vorgeplant">📌</span>
							<button
								class="btn btn-ghost btn-xs px-1"
								title="aus Vorplanung entfernen"
								on:click={() => removePrePlan(exam.ancode, room)}
							>
								✕
							</button>
						{:else}
							<button
								class="btn btn-outline btn-xs"
								on:click={() => prePlanRoom(exam.ancode, room)}
							>
								OK
							</button>
						{/if}
						{#if room.handicap}
							<span>
								{room.room.name} (
								{#each room.studentsInRoom as student}{ntaName(plannedExam, student)};{/each}
								<span class="badge badge-warning badge-sm">{room.duration} Min.</span>)
							</span>
						{:else}
							<span class="flex flex-wrap items-center gap-1">
								<span class="font-medium">{room.room.name}</span>
								{#if room.room.name != 'ONLINE' && room.room.name != 'No Room'}
									<span class="text-base-content/60">({room.studentsInRoom.length}/{room.room.seats})</span>
									{#if room.reserve}<span class="badge badge-info badge-sm">Reserve</span>{/if}
								{/if}
								{#if room.room.name == 'No Room'}
									<span class="text-base-content/60">({room.studentsInRoom.length})</span>
								{/if}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-sm text-error">kein Raum!</div>
		{/if}

		<!-- NTAs (nur bei aktiviertem „NTA-Details"-Toggle) -->
		{#if hasNtas && details}
			<div class="flex flex-col gap-1">
				{#each ntas as nta}
					<div class="rounded border border-base-300 px-2 py-1 text-xs">
						<div class="flex items-center gap-1">
							<span class="font-medium">{nta.name}</span>
							<span class="font-mono text-base-content/50">{nta.mtknr}</span>
							{#if nta.needsRoomAlone}<span class="badge badge-error badge-sm">eigener Raum</span>{/if}
						</div>
						<div class="text-base-content/60">{nta.compensation}</div>
						<div class="mt-1 flex items-center gap-2">
							<span class="tabular-nums">+{nta.deltaDurationPercent}%</span>
							<progress
								class="progress progress-warning h-1.5 flex-1"
								value={nta.deltaDurationPercent}
								max={100}
							></progress>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
