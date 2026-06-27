<script>
	import { classifyRoom } from '$lib/room/roomCategories';
	import WriteButton from '$lib/WriteButton.svelte';

	/** @type {any} */
	export let plannedExam;
	export let showOnlyExamsWithNTAs;
	export let details;
	export let showRooms;
	/** bei Raumauswahl: andere Räume/Prüfungen gedimmt mit anzeigen */
	export let dimOthers = false;
	/** Tag dieser Karte — für die Raum-Vorplanung (freie Plätze pro Slot) @type {number | null} */
	export let day = null;
	/** Slot dieser Karte @type {number | null} */
	export let time = null;
	/** nur Prüfungen anzeigen, die (noch) keinen Raum haben */
	export let showOnlyWithoutRoom = false;
	/** nicht fixierte (nicht vorgeplante) Räume hervorheben, fixierte gedimmt */
	export let highlightNotPrePlanned = false;
	/** fix vorgeplante Platzzahlen je „ancode|raum|mtknr" @type {Record<string, number>} */
	export let prePlannedSeats = {};
	/** Ancodes mit nicht zugeordneten Studierenden (für „nur ohne Raum") @type {Set<number>} */
	export let unplacedAncodes = new Set();

	let exam = plannedExam.zpaExam;
	let constraints = plannedExam.constraints;
	let ntas = plannedExam.ntas;

	// enthält diese Prüfung den ausgewählten Raum?
	$: matchesRoom =
		showRooms === 'all' ||
		(plannedExam.plannedRooms || []).some((/** @type {any} */ r) => r.room.name === showRooms);
	$: passNta = !showOnlyExamsWithNTAs || (ntas && ntas.length > 0);
	// „ohne Raum": nicht zugeordnete Studierende (autoritativ aus unplacedExams)
	// oder gar keine geplanten Räume.
	$: hasNoRoom =
		unplacedAncodes.has(exam.ancode) ||
		!plannedExam.plannedRooms ||
		plannedExam.plannedRooms.length === 0;
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

	/** @param {any} exam @param {string} mtknr */
	function ntaFor(exam, mtknr) {
		return (exam.ntas || []).find((/** @type {any} */ n) => n.mtknr == mtknr);
	}

	// fix vorgeplante Platzzahl dieses Raums (lokal optimistisch oder aus dem
	// Server-Datensatz), sonst undefined.
	/** @param {any} room */
	function fixedSeatsFor(room) {
		if (room.fixedSeats != null) return room.fixedSeats;
		return prePlannedSeats[`${exam.ancode}|${room.room.name}|${room.ntaMtknr ?? ''}`];
	}

	// braucht (eine) NTA in diesem Raum einen eigenen Raum? — direkt am Raum zeigen
	/** @param {any} room */
	function roomNeedsAlone(room) {
		if (room.handicapRoomAlone) return true;
		return (room.studentsInRoom || []).some(
			(/** @type {string} */ m) => ntaFor(plannedExam, m)?.needsRoomAlone
		);
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

	// ----- Raum-Picker: einen Raum von Hand vorplanen (auch belegte Räume als
	// Reserve mitnutzen oder als NTA-Raum). Lädt die freien Plätze pro Slot bei
	// Bedarf nach. -----
	let showPicker = false;
	/** @type {'normal' | 'reserve' | 'nta'} */
	let pickVariant = 'normal';
	let pickMtknr = ''; // bei Variante „nta": gewählte Matrikelnummer
	let pickSeats = '';
	let pickError = '';
	/** @type {any[] | null} */
	let slotRooms = null;
	let loadingRooms = false;

	async function openPicker() {
		showPicker = true;
		pickError = '';
		pickSeats = '';
		pickVariant = 'normal';
		pickMtknr = '';
		if (slotRooms !== null || loadingRooms) return;
		loadingRooms = true;
		try {
			const res = await fetch('/api/plan/roomsWithFreeSeatsForSlot', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ day, time })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) throw new Error(d?.error || `Fehler (HTTP ${res.status})`);
			slotRooms = d.roomsWithFreeSeatsForSlot ?? [];
		} catch (e) {
			pickError = e instanceof Error ? e.message : String(e);
			slotRooms = [];
		} finally {
			loadingRooms = false;
		}
	}

	// Hinweis (Warnung, keine Sperre), warum ein Raum für diese Prüfung untypisch
	// ist: Sonderraum-Merkmal, das die Prüfung nicht fordert, oder umgekehrt.
	// EXaHM/SEB dürfen gemischt werden: eine SEB-Prüfung darf auch in EXaHM-Räume
	// (EXaHM bleibt strikt: nur EXaHM-Räume).
	/** @param {any} r */
	function mismatchReason(r) {
		if (exahm && !r.exahm) return 'kein EXaHM-Raum';
		if (seb && !r.seb && !r.exahm) return 'kein SEB-/EXaHM-Raum';
		if (lab && !r.lab) return 'kein Labor-Raum';
		if (r.exahm && !exahm && !seb) return 'EXaHM-Raum';
		if (r.seb && !seb) return 'SEB-Raum';
		if (r.lab && !lab) return 'Labor-Raum';
		return null;
	}

	// auswählbare Räume (für Reserve-/Mitnutzung): alle außer „No Room".
	// Bewusst NICHT ausgeblendet werden Räume, die schon von einer anderen
	// Prüfung belegt sind (usedBy) oder bereits (z. B. als NTA-Raum) für diese
	// Prüfung vorgeplant sind — Mitnutzung ist gewollt. Verfügbarkeit zeigt sich
	// an freeSeats; Constraint-Eignung bleibt als Hinweis (mismatchReason).
	$: pickerCandidates = (slotRooms || [])
		.filter((/** @type {any} */ r) => r.roomName !== 'No Room')
		.map((/** @type {any} */ r) => ({
			...r,
			dimReason: mismatchReason(r),
			full: r.freeSeats <= 0
		}))
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.roomName.localeCompare(b.roomName));

	/** @param {any} c */
	async function addRoom(c) {
		pickError = '';
		const isNta = pickVariant === 'nta';
		const reserve = pickVariant === 'reserve';
		/** @type {string | null} */
		let mtknr = null;
		/** @type {number | null} */
		let seats = null;
		if (isNta) {
			if (!pickMtknr) {
				pickError = 'Bitte NTA-Studierende/n wählen.';
				return;
			}
			mtknr = pickMtknr;
		} else if (pickSeats.trim() !== '') {
			// optionale feste Platzzahl (leer = Raum normal füllen); durch Raumkapazität begrenzt
			seats = Number(pickSeats);
			if (!Number.isInteger(seats) || seats < 1) {
				pickError = 'Plätze muss eine Zahl ≥ 1 sein.';
				return;
			}
			if (seats > c.seats) {
				pickError = `${c.roomName} hat nur ${c.seats} Plätze.`;
				return;
			}
		}
		// nicht hart sperren — die Vorplanung ist eine bewusste Entscheidung; nur
		// bei untypischer Eignung bzw. fehlenden Plätzen rückfragen.
		/** @type {string[]} */
		const warns = [];
		if (c.dimReason) warns.push(c.dimReason);
		if (c.full) warns.push(`keine freien Plätze (${c.usedSeats}/${c.seats} belegt)`);
		const kindLabel = isNta ? 'als NTA-Raum ' : reserve ? 'als Reserve ' : '';
		if (
			warns.length &&
			!confirm(`${c.roomName}: ${warns.join(', ')}. Trotzdem ${kindLabel}vorplanen?`)
		)
			return;
		// optimistisch als gepinnten Raum anzeigen (rendert über die bestehende Liste,
		// das 📌 löst die Vorplanung wieder). NTA → Handicap-Eintrag mit Mtknr.
		const newRoom = {
			room: {
				name: c.roomName,
				seats: c.seats,
				handicap: isNta,
				lab: c.lab,
				exahm: c.exahm,
				seb: c.seb
			},
			studentsInRoom: isNta && mtknr ? [mtknr] : [],
			reserve,
			handicap: isNta,
			handicapRoomAlone: false,
			duration: exam.duration,
			ntaMtknr: mtknr,
			prePlanned: true,
			fixedSeats: seats
		};
		plannedExam.plannedRooms = [...(plannedExam.plannedRooms || []), newRoom];
		const roomName = c.roomName;
		showPicker = false;
		try {
			const res = await fetch('/api/prePlanRoom', {
				method: 'POST',
				body: JSON.stringify({ ancode: exam.ancode, roomName, reserve, mtknr, seats }),
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
			showPicker = true;
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
						<WriteButton
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
						</WriteButton>
						{#if room.handicap}
							<span class="flex flex-wrap items-center gap-1">
								<span class="badge badge-neutral badge-sm">NTA</span>
								<span>
									{room.room.name} (
									{#each room.studentsInRoom as student}{ntaName(plannedExam, student)};{/each})
								</span>
								{#if roomNeedsAlone(room)}
									<span class="badge badge-error badge-sm">eigener Raum</span>
								{/if}
								<span class="badge badge-warning badge-sm">{room.duration} Min.</span>
							</span>
						{:else}
							<span class="flex flex-wrap items-center gap-1">
								<span class="font-medium">{room.room.name}</span>
								{#if room.room.name != 'ONLINE'}
									<span class="text-base-content/60"
										>({room.studentsInRoom.length}/{room.room.seats})</span
									>
									{#if room.reserve}<span class="badge badge-info badge-sm">Reserve</span>{/if}
									{#if fixedSeatsFor(room) != null}
										<span class="badge badge-neutral badge-sm"
											>{fixedSeatsFor(room)} Plätze (fix)</span
										>
									{/if}
								{/if}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-sm text-error">kein Raum!</div>
		{/if}

		<!-- Raum vorplanen (von Hand zuordnen; belegte Räume als Reserve mitnutzbar) -->
		{#if day != null && time != null}
			<div class="flex flex-col gap-1">
				{#if showPicker}
					<div class="flex flex-col gap-1 rounded-lg border border-base-300 bg-base-200/40 p-2">
						<div class="flex items-center justify-between gap-2">
							<div class="flex flex-wrap items-center gap-2">
								<select class="select select-bordered select-xs" bind:value={pickVariant}>
									<option value="normal">normaler Raum</option>
									<option value="reserve">Reserveraum</option>
									{#if ntas && ntas.length}
										<option value="nta">Raum für NTA</option>
									{/if}
								</select>
								{#if pickVariant === 'nta'}
									<select class="select select-bordered select-xs" bind:value={pickMtknr}>
										<option value="">NTA wählen…</option>
										{#each ntas as n}
											<option value={n.mtknr}>{n.name} ({n.mtknr})</option>
										{/each}
									</select>
								{:else}
									<label class="flex items-center gap-1" title="leer = Raum normal füllen">
										<span class="text-xs text-base-content/60">Plätze</span>
										<input
											type="text"
											inputmode="numeric"
											class="input input-bordered input-xs w-16"
											placeholder="alle"
											bind:value={pickSeats}
										/>
									</label>
								{/if}
							</div>
							<button
								class="btn btn-ghost btn-xs"
								title="schließen"
								on:click={() => (showPicker = false)}>✕</button
							>
						</div>
						{#if loadingRooms}
							<div class="text-xs text-base-content/50">lädt…</div>
						{:else if pickerCandidates.length === 0}
							<div class="text-xs text-base-content/50">keine passenden Räume im Slot</div>
						{:else}
							<div class="flex max-h-56 flex-col gap-1 overflow-y-auto">
								{#each pickerCandidates as c}
									<WriteButton
										class="flex flex-col items-start gap-0.5 rounded border border-base-300 px-2 py-1 text-left text-xs hover:bg-base-200 {c.dimReason
											? 'opacity-70'
											: ''}"
										title={c.dimReason ? `${c.dimReason} — trotzdem wählbar` : 'vorplanen'}
										on:click={() => addRoom(c)}
									>
										<div class="flex w-full flex-wrap items-center gap-1">
											<span class="font-medium">{c.roomName}</span>
											<span class={c.full ? 'text-error' : 'text-base-content/60'}>
												{c.freeSeats} von {c.seats} frei
											</span>
											{#if c.exahm}<span class="badge badge-info badge-xs">EXaHM</span>{/if}
											{#if c.seb}<span class="badge badge-error badge-xs">SEB</span>{/if}
											{#if c.lab}<span class="badge badge-warning badge-xs">Labor</span>{/if}
											{#if c.handicap}<span class="badge badge-neutral badge-xs">NTA</span>{/if}
											{#if c.dimReason}
												<span class="ml-auto text-warning">⚠ {c.dimReason}</span>
											{:else if c.full}
												<span class="ml-auto text-error">kein Platz frei</span>
											{/if}
										</div>
										{#if c.usedBy && c.usedBy.length}
											<div class="text-base-content/50">
												belegt von: {#each c.usedBy as u, i}{u.ancode}. {u.module} ({u.examer}), {u.studentCount}
													Stud.{i < c.usedBy.length - 1 ? '; ' : ''}{/each}
											</div>
										{/if}
									</WriteButton>
								{/each}
							</div>
						{/if}
						<div class="text-[10px] text-base-content/40">
							Nach dem Vorplanen ggf. „Räume für Prüfungen generieren", damit es wirksam wird.
						</div>
					</div>
				{:else}
					<button
						class="btn btn-ghost btn-xs self-start text-xs text-base-content/60"
						on:click={openPicker}>➕ Raum vorplanen</button
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
