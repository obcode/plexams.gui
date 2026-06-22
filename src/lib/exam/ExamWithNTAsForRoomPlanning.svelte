<script>
	import { classifyRoom } from '$lib/room/roomCategories';

	/** @type {any} */
	export let plannedExam;
	export let showOnlyExamsWithNTAs;
	export let details;
	export let showRooms;
	/** bei Raumauswahl: andere Räume/Prüfungen gedimmt mit anzeigen */
	export let dimOthers = false;
	/** für den Raum-Picker (Vorplanung): alle aktiven Räume @type {any[]} */
	export let rooms = [];
	/** nur Prüfungen anzeigen, die (noch) keinen Raum haben */
	export let showOnlyWithoutRoom = false;
	/** nicht fixierte (nicht vorgeplante) Räume hervorheben, fixierte gedimmt */
	export let highlightNotPrePlanned = false;

	let exam = plannedExam.zpaExam;
	let constraints = plannedExam.constraints;
	let ntas = plannedExam.ntas;

	// enthält diese Prüfung den ausgewählten Raum?
	$: matchesRoom =
		showRooms === 'all' ||
		(plannedExam.plannedRooms || []).some((/** @type {any} */ r) => r.room.name === showRooms);
	$: passNta = !showOnlyExamsWithNTAs || (ntas && ntas.length > 0);
	// „kein Raum": keine geplanten Räume oder ein „No Room"-Eintrag vorhanden
	$: hasNoRoom =
		!plannedExam.plannedRooms ||
		plannedExam.plannedRooms.length === 0 ||
		plannedExam.plannedRooms.some((/** @type {any} */ r) => r.room.name === 'No Room');
	$: passNoRoom = !showOnlyWithoutRoom || hasNoRoom;
	// sichtbar: bei Raumauswahl ohne Treffer nur, wenn „andere gedimmt" aktiv
	$: visible = passNta && passNoRoom && (showRooms === 'all' || matchesRoom || dimOthers);
	// hat die Prüfung mindestens einen nicht fixierten (echten) Raum?
	$: hasNotPrePlanned = (plannedExam.plannedRooms || []).some(
		(/** @type {any} */ r) => !r.prePlanned && r.room.name !== 'No Room'
	);
	// ganze Karte dimmen: bei Raumauswahl ohne Treffer, oder im „nur nicht
	// fixierte"-Modus, wenn die Karte keinen nicht fixierten Raum hat
	$: dimmed =
		(showRooms !== 'all' && !matchesRoom) || (highlightNotPrePlanned && !hasNotPrePlanned);

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

	// ----- Raum-Picker: einen Raum von Hand vorplanen (vor jeglicher Generierung) -----
	let showPicker = false;
	let pickRoom = '';
	let allRoomsInPicker = false;
	let pickError = '';

	$: hasConstraintFilter = exahm || seb || placesWithSocket || lab;
	$: plannedNames = new Set(
		(plannedExam.plannedRooms || []).map((/** @type {any} */ r) => r.room.name)
	);
	/** @param {any} r */
	function roomMatchesConstraints(r) {
		if (exahm && !r.exahm) return false;
		if (seb && !r.seb) return false;
		if (placesWithSocket && !r.placesWithSocket) return false;
		if (lab && !r.lab) return false;
		return true;
	}
	// auswählbare Räume: aktiv, nicht „No Room", nicht schon verplant,
	// per Constraints gefiltert (außer „alle Räume" ist aktiv)
	$: candidates = (rooms || [])
		.filter((/** @type {any} */ r) => r.name !== 'No Room' && !plannedNames.has(r.name))
		.filter((/** @type {any} */ r) => allRoomsInPicker || roomMatchesConstraints(r))
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.name.localeCompare(b.name));

	async function addRoom() {
		const r = (rooms || []).find((/** @type {any} */ x) => x.name === pickRoom);
		if (!r) return;
		pickError = '';
		// optimistisch als gepinnten Raum anzeigen (rendert über die bestehende Liste,
		// das 📌 löst die Vorplanung wieder)
		const newRoom = {
			room: r,
			studentsInRoom: [],
			reserve: false,
			handicap: false,
			handicapRoomAlone: false,
			duration: exam.duration,
			ntaMtknr: null,
			prePlanned: true
		};
		plannedExam.plannedRooms = [...(plannedExam.plannedRooms || []), newRoom];
		const roomName = r.name;
		pickRoom = '';
		showPicker = false;
		try {
			const res = await fetch('/api/prePlanRoom', {
				method: 'POST',
				body: JSON.stringify({ ancode: exam.ancode, roomName, reserve: false, mtknr: null }),
				headers: { 'content-type': 'application/json' }
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) throw new Error(result?.error || `Fehler (HTTP ${res.status})`);
		} catch (e) {
			// bei Fehler die optimistische Zuordnung zurücknehmen
			plannedExam.plannedRooms = (plannedExam.plannedRooms || []).filter(
				(/** @type {any} */ x) => x !== newRoom
			);
			pickError = e instanceof Error ? e.message : String(e);
		}
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
							.chip} {room.handicap ? 'border-dashed' : ''} {highlightNotPrePlanned &&
						!room.prePlanned &&
						room.room.name !== 'No Room'
							? 'font-semibold ring-2 ring-primary ring-offset-1'
							: ''} {(highlightNotPrePlanned && room.prePlanned) ||
						(showRooms !== 'all' && !dimmed && room.room.name !== showRooms)
							? 'opacity-30'
							: ''}"
					>
						<button
							class="btn btn-ghost btn-xs btn-circle text-base transition-opacity {room.prePlanned
								? ''
								: 'opacity-25 hover:opacity-100'}"
							title={room.prePlanned
								? 'in Vorplanung fixiert – klicken zum Lösen'
								: 'in Vorplanung fixieren (überlebt Neugenerierung)'}
							on:click={() =>
								room.prePlanned ? removePrePlan(exam.ancode, room) : prePlanRoom(exam.ancode, room)}
						>
							📌
						</button>
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
									<span class="text-base-content/60"
										>({room.studentsInRoom.length}/{room.room.seats})</span
									>
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

		<!-- Raum vorplanen (von Hand zuordnen, vor jeglicher Generierung) -->
		{#if rooms && rooms.length}
			<div class="flex flex-col gap-1">
				{#if showPicker}
					<div class="flex items-center gap-1">
						<!-- svelte-ignore a11y-no-onchange -->
						<select class="select select-bordered select-xs flex-1" bind:value={pickRoom}>
							<option value="" disabled>Raum wählen…</option>
							{#each candidates as r}
								<option value={r.name}>{r.name} ({r.seats})</option>
							{/each}
						</select>
						<button class="btn btn-primary btn-xs" disabled={!pickRoom} on:click={addRoom}>+</button
						>
						<button
							class="btn btn-ghost btn-xs"
							title="abbrechen"
							on:click={() => {
								showPicker = false;
								pickRoom = '';
							}}>✕</button
						>
					</div>
					{#if hasConstraintFilter}
						<label class="label cursor-pointer justify-start gap-1 py-0">
							<input type="checkbox" class="checkbox checkbox-xs" bind:checked={allRoomsInPicker} />
							<span class="label-text text-xs">alle Räume (Constraints ignorieren)</span>
						</label>
					{/if}
				{:else}
					<button
						class="btn btn-ghost btn-xs self-start text-xs text-base-content/60"
						on:click={() => (showPicker = true)}>➕ Raum vorplanen</button
					>
				{/if}
				{#if pickError}
					<div class="text-xs text-error">{pickError}</div>
				{/if}
			</div>
		{/if}

		<!-- NTAs (nur bei aktiviertem „NTA-Details"-Toggle) -->
		{#if hasNtas && details}
			<div class="flex flex-col gap-1">
				{#each ntas as nta}
					<div class="rounded border border-base-300 px-2 py-1 text-xs">
						<div class="flex items-center gap-1">
							<span class="font-medium">{nta.name}</span>
							<span class="font-mono text-base-content/50">{nta.mtknr}</span>
							{#if nta.needsRoomAlone}<span class="badge badge-error badge-sm">eigener Raum</span
								>{/if}
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
