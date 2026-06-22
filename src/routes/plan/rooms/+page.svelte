<script>
	export let data;
	import ExamsForRoomPlanning from '$lib/slot/ExamsForRoomPlanning.svelte';
	import RoomNamesInSlot from '$lib/slot/RoomNamesInSlot.svelte';
	import { mkDate, mkDateShort } from '$lib/jshelper/misc';
	import { ROOM_CATEGORIES } from '$lib/room/roomCategories';
	import SubscriptionTerminal from '$lib/SubscriptionTerminal.svelte';
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	// nach einer Generierung neu laden: invalidateAll frischt die Load-Daten
	// (Raster, Zähler, No-Room-Warnung) auf, der reloadKey hängt die
	// client-seitig nachladenden Slot-Komponenten neu ein.
	let reloadKey = 0;
	async function onGenerated() {
		needsRegen = false;
		reloadKey++;
		await invalidateAll();
	}

	// Generierte Raumzuteilung verwerfen (destruktiv) — Vorplanung (📌) bleibt.
	let resetBusy = false;
	async function resetRooms() {
		if (resetBusy) return;
		if (
			!confirm(
				'Alle generierten Räume zurücksetzen? Vorgeplante (📌) Räume bleiben erhalten. Das lässt sich nicht rückgängig machen.'
			)
		)
			return;
		resetBusy = true;
		blockError = null;
		try {
			const res = await fetch('/api/resetRoomsForExams', { method: 'POST' });
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				const msg = result?.error ?? `Fehler (HTTP ${res.status})`;
				blockError = /published|locked|veröffentlicht/i.test(msg)
					? 'Raumplan ist veröffentlicht und gesperrt — erst die Veröffentlichung auf der Startseite zurücknehmen (Häkchen „Raumplan veröffentlicht").'
					: msg;
				return;
			}
			await onGenerated();
		} catch (e) {
			blockError = e instanceof Error ? e.message : String(e);
		} finally {
			resetBusy = false;
		}
	}

	// Tag → Datum, Slot → Startzeit (für die „ohne Raum"-Warnung).
	$: dayDateById = Object.fromEntries(
		data.semesterConfig.days.map((/** @type {any} */ d) => [d.number, d.date])
	);
	$: slotStartById = Object.fromEntries(
		data.semesterConfig.starttimes.map((/** @type {any} */ s) => [s.number, s.start])
	);

	/** @type {'exams' | 'rooms'} */
	let view = 'exams';

	let showOnlyExamsWithNTAs = false;
	let details = false;
	let showRooms = 'all';
	let dimOthers = false;
	let showOnlyWithoutRoom = false;
	let highlightNotPrePlanned = false;

	/** @param {number} day @param {number} slot @param {string} roomName */
	const isPlanned = (day, slot, roomName) => data.plannedRooms.has(`${day}-${slot}-${roomName}`);

	/** ist der Raum an diesem Tag in irgendeinem Slot geplant? @param {number} day @param {string} room */
	const roomUsedOnDay = (day, room) =>
		data.semesterConfig.starttimes.some((/** @type {any} */ t) => isPlanned(day, t.number, room));

	// aufgeklappte Tage (Sicht „nach Prüfungen"). Bei Raumauswahl nur die Tage
	// offen, an denen der Raum geplant ist; ohne Auswahl folgt es „alle Tage".
	/** @type {Record<number, boolean>} */
	let showDays = {};
	let showAllDays = false;
	/** @param {string} rooms @param {boolean} allDays */
	function applyDayDefaults(rooms, allDays) {
		for (const day of data.semesterConfig.days) {
			showDays[day.number] = rooms === 'all' ? allDays : roomUsedOnDay(day.number, rooms);
		}
		showDays = showDays;
	}
	$: applyDayDefaults(showRooms, showAllDays);

	// Sprung aus der „ohne Raum"-Warnung zum passenden Tag/Slot.
	/** @param {number} day @param {number} slot */
	async function jumpTo(day, slot) {
		view = 'exams';
		showRooms = 'all';
		await tick(); // applyDayDefaults laufen lassen
		showDays[day] = true;
		showDays = showDays;
		await tick();
		document
			.getElementById(`slot-${day}-${slot}`)
			?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	$: baseRooms = data.plannedRoomNames.filter((/** @type {string} */ r) => r !== 'No Room');
	$: gridRooms =
		showRooms === 'all'
			? baseRooms
			: baseRooms.filter((/** @type {string} */ r) => r === showRooms);

	// Gesperrte Räume pro Slot (lokal gehalten, da Blocks erst nach erneuter
	// Generierung in planned_rooms wirken).
	/** @type {Map<string, string>} */
	let blockedMap = new Map(
		data.blockedRooms.map((/** @type {any} */ b) => [
			`${b.day}-${b.slot}-${b.room}`,
			b.reason ?? ''
		])
	);
	/** @type {Set<string>} */
	let blockBusy = new Set();
	/** @type {string | null} */
	let blockError = null;
	let needsRegen = false;

	/** @param {number} n */
	const prePlanWarn = (n) =>
		`${n === 1 ? 'In diesem Slot ist dieser Raum' : `${n} betroffene Slots haben diesen Raum`} vorgeplant (📌). Beim Generieren wird er dort übersprungen. Trotzdem sperren?`;

	/** @param {number} day @param {number} slot @param {string} room */
	async function toggleBlock(day, slot, room) {
		const key = `${day}-${slot}-${room}`;
		if (blockBusy.has(key)) return;
		const isBlocked = blockedMap.has(key);
		/** @type {string | null} */
		let reason = '';
		if (!isBlocked) {
			if (data.prePlannedRooms.has(key) && !confirm(prePlanWarn(1))) return;
			reason = window.prompt('Grund (optional), z. B. „anderweitig belegt 12–17":', '') ?? '';
		}
		blockBusy = new Set(blockBusy).add(key);
		blockError = null;
		try {
			const url = isBlocked ? '/api/unblockRoomForSlot' : '/api/blockRoomForSlot';
			const body = isBlocked ? { room, day, slot } : { room, day, slot, reason };
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				blockError = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			if (isBlocked) blockedMap.delete(key);
			else blockedMap.set(key, reason ?? '');
			blockedMap = blockedMap;
			needsRegen = true;
		} catch (e) {
			blockError = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(blockBusy);
			s.delete(key);
			blockBusy = s;
		}
	}

	// ganzen Tag für einen Raum sperren/freigeben (Mehrfach-Mutation).
	/** @param {number} day @param {string} room */
	async function toggleBlockDay(day, room) {
		const dayKey = `day-${day}-${room}`;
		if (blockBusy.has(dayKey)) return;
		const allSlots = data.semesterConfig.starttimes.map((/** @type {any} */ t) => t.number);
		const keys = allSlots.map((/** @type {number} */ s) => `${day}-${s}-${room}`);
		const allBlocked = keys.every((/** @type {string} */ k) => blockedMap.has(k));
		/** @type {string | null} */
		let reason = '';
		if (!allBlocked) {
			const pre = keys.filter((/** @type {string} */ k) => data.prePlannedRooms.has(k)).length;
			if (pre > 0 && !confirm(prePlanWarn(pre))) return;
			reason = window.prompt(`Ganzen Tag sperren – Grund (optional):`, '') ?? '';
		}
		blockBusy = new Set(blockBusy).add(dayKey);
		blockError = null;
		try {
			const slots = allSlots.map((/** @type {number} */ s) => ({ day, slot: s }));
			const url = allBlocked ? '/api/unblockRoomForSlots' : '/api/blockRoomForSlots';
			const body = allBlocked ? { room, slots } : { room, slots, reason };
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				blockError = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			for (const k of keys) {
				if (allBlocked) blockedMap.delete(k);
				else blockedMap.set(k, reason ?? '');
			}
			blockedMap = blockedMap;
			needsRegen = true;
		} catch (e) {
			blockError = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(blockBusy);
			s.delete(dayKey);
			blockBusy = s;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Raumplanung</h1>
		<div class="flex-1"></div>
		<div role="tablist" class="tabs tabs-boxed">
			<button
				role="tab"
				class="tab {view === 'exams' ? 'tab-active' : ''}"
				on:click={() => (view = 'exams')}>nach Prüfungen</button
			>
			<button
				role="tab"
				class="tab {view === 'rooms' ? 'tab-active' : ''}"
				on:click={() => (view = 'rooms')}>nach Räumen</button
			>
		</div>
	</div>

	<!-- Generierung -->
	<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="text-sm font-medium">Generierung & Import</div>
		{#if data.roomsBlocked}
			<div class="alert alert-warning py-2 text-sm">
				<span>
					🔒 Raumgenerierung gesperrt — der Raumplan ist veröffentlicht. Für Korrekturen das Häkchen
					„Raumplan veröffentlicht" auf der Startseite kurz lösen.
				</span>
			</div>
		{/if}
		{#if needsRegen}
			<div class="alert alert-warning py-2 text-sm">
				<span>
					Raum-Sperren geändert — bitte „Räume für Prüfungen generieren", damit sie berücksichtigt
					werden.
				</span>
			</div>
		{/if}
		<SubscriptionTerminal
			actions={[
				{
					field: 'generateRoomsForExams',
					label: 'Räume für Prüfungen generieren',
					primary: true,
					disabled: data.roomsBlocked
				},
				{
					field: 'generateRoomsForSlots',
					label: 'Erlaubte Räume pro Slot neu berechnen',
					disabled: data.roomsBlocked
				},
				{ field: 'importAnnyBookings', label: 'Anny-Buchungen importieren' }
			]}
			on:done={onGenerated}
		/>
		<p class="text-xs text-base-content/50">
			EXaHM-Raum-Slots kommen ausschließlich aus dem Anny-Import — ohne Import keine EXaHM-Belegung.
		</p>
		<div class="flex flex-wrap items-center gap-2 border-t border-base-300 pt-2">
			<button
				class="btn btn-outline btn-error btn-sm"
				disabled={data.roomsBlocked || resetBusy}
				on:click={resetRooms}
			>
				{resetBusy ? 'Setzt zurück…' : 'Generierte Räume zurücksetzen'}
			</button>
			<span class="text-xs text-base-content/50">
				entfernt die generierte Raumzuteilung; vorgeplante (📌) Räume bleiben erhalten.
			</span>
		</div>
	</div>

	{#if blockError}
		<div class="alert alert-error py-2 text-sm"><span>{blockError}</span></div>
	{/if}

	<!-- Große Warnung: nicht zugeordnete Studierende (aus unplacedExams) -->
	{#if data.unplaced.length}
		<div class="alert alert-error shadow">
			<div class="flex flex-col gap-1">
				<div class="text-base font-semibold">
					⚠ {data.totalUnplaced} Studierende noch ohne Raum ({data.unplaced.length} Eintrag(e))
				</div>
				<div class="flex flex-wrap gap-1">
					{#each data.unplaced as n}
						<button
							class="badge badge-sm cursor-pointer gap-1 border-error-content/30 hover:underline"
							title="zum Tag/Slot springen (Tag {n.day} · Slot {n.slot})"
							on:click={() => jumpTo(n.day, n.slot)}
						>
							{#if n.nta}<span class="font-semibold">NTA</span>{/if}
							{n.ancode}
							{n.module}{n.mainExamer ? ` · ${n.mainExamer}` : ''} · {dayDateById[n.day]
								? mkDateShort(dayDateById[n.day])
								: `Tag ${n.day}`}
							{slotStartById[n.slot] ?? `Slot ${n.slot}`} · {n.count}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-4 rounded-lg border border-base-300 bg-base-100 p-3">
		<select class="select select-bordered select-sm w-56" bind:value={showRooms}>
			<option value="all">Alle Räume</option>
			{#each baseRooms as plannedRoomName}
				<option value={plannedRoomName}>
					{plannedRoomName} ({data.roomCounts[plannedRoomName] ?? 0}×)
				</option>
			{/each}
		</select>
		{#if view === 'exams'}
			{#if showRooms !== 'all'}
				<label class="label cursor-pointer gap-2">
					<input type="checkbox" class="toggle toggle-sm" bind:checked={dimOthers} />
					<span class="label-text">andere Räume gedimmt</span>
				</label>
			{/if}
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showAllDays} />
				<span class="label-text">alle Tage</span>
			</label>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showOnlyWithoutRoom} />
				<span class="label-text">nur ohne Raum</span>
			</label>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={highlightNotPrePlanned} />
				<span class="label-text">nicht fixierte hervorheben</span>
			</label>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showOnlyExamsWithNTAs} />
				<span class="label-text">nur mit NTAs</span>
			</label>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={details} />
				<span class="label-text">NTA-Details</span>
			</label>
		{/if}
	</div>

	{#key reloadKey}
		<!-- ============== nach Prüfungen ============== -->
		{#if view === 'exams'}
			<div class="flex flex-col gap-1 text-xs text-base-content/70">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
					<span class="font-medium">Legende:</span>
					{#each ROOM_CATEGORIES as c}
						<span class="inline-flex items-center gap-1">
							<span class="inline-block h-3 w-3 rounded border border-base-content/20 {c.swatch}"
							></span>
							{c.label}
						</span>
					{/each}
				</div>
				<div>
					📌 = in die Vorplanung fixiert (überlebt die Neugenerierung) — auf das Pin-Symbol am Raum
					klicken zum Fixieren bzw. Lösen. „➕ Raum vorplanen" ordnet einer Prüfung von Hand einen
					Raum zu (auch vor jeder Generierung); der Raum landet direkt fixiert in der Vorplanung.
				</div>
			</div>
			<div class="flex flex-col gap-2">
				{#each data.semesterConfig.days as day}
					<div class="overflow-hidden rounded-lg border border-base-300 bg-base-100">
						<button
							class="flex w-full items-center gap-2 px-4 py-2 text-left font-medium hover:bg-base-200"
							on:click={() => (showDays[day.number] = !showDays[day.number])}
						>
							<span class="text-base-content/50">{showDays[day.number] ? '▾' : '▸'}</span>
							Tag {day.number}
							<span class="text-sm font-normal text-base-content/50">{mkDate(day.date)}</span>
						</button>
						{#if showDays[day.number]}
							<!-- Klick auf freie Fläche (nicht auf Karten/Slots) klappt den Tag zu -->
							<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
							<div
								class="flex flex-col gap-3 border-t border-base-300 p-3"
								transition:slide
								role="presentation"
								on:click={(e) => {
									if (e.target === e.currentTarget) showDays[day.number] = false;
								}}
							>
								{#each data.semesterConfig.starttimes as time}
									<div class="grid grid-cols-12 gap-3" id="slot-{day.number}-{time.number}">
										<div class="col-span-12 flex flex-col gap-2 sm:col-span-2">
											<div class="rounded-lg border border-base-300 bg-base-200 px-3 py-2 text-sm">
												<div class="font-semibold">Slot {time.number}</div>
												<div class="text-xs text-base-content/60">{time.start}</div>
											</div>
											{#if showRooms === 'all'}
												<RoomNamesInSlot day={day.number} time={time.number} />
											{/if}
										</div>
										<div class="col-span-12 sm:col-span-10">
											<div class="flex flex-wrap gap-2">
												<ExamsForRoomPlanning
													day={day.number}
													time={time.number}
													{showOnlyExamsWithNTAs}
													{details}
													{showRooms}
													{dimOthers}
													{showOnlyWithoutRoom}
													{highlightNotPrePlanned}
													prePlannedSeats={data.prePlannedSeats}
													unplacedAncodes={data.unplacedAncodes}
												/>
											</div>
										</div>
									</div>
								{/each}

								<!-- Fuß-Leiste zum Zuklappen, ohne nach oben scrollen zu müssen -->
								<button
									class="-mx-3 -mb-3 mt-1 flex items-center justify-center gap-2 rounded-b-lg border-t border-base-300 px-4 py-2 text-sm font-medium text-base-content/50 hover:bg-base-200"
									on:click={() => (showDays[day.number] = false)}
								>
									▴ Tag {day.number} zuklappen
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- ============== nach Räumen ============== -->
		{:else}
			<p class="text-xs text-base-content/50">
				Übersicht, in welchen Slots ein Raum eingeplant ist (Zahl = Slot-Nummer). Klick auf eine
				Zelle sperrt/entsperrt den Raum für diesen Slot (durchgestrichen = gesperrt); danach neu
				generieren.
			</p>
			<div class="overflow-x-auto rounded-lg border border-base-300">
				<table class="table table-zebra table-sm">
					<thead>
						<tr>
							<th class="sticky left-0 bg-base-200">Raum</th>
							{#each data.semesterConfig.days as day}
								<th class="text-center whitespace-nowrap">
									Tag {day.number}<br /><span class="font-normal text-base-content/50"
										>{mkDateShort(day.date)}</span
									>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each gridRooms as roomName}
							<tr>
								<td class="sticky left-0 bg-base-100 font-medium">{roomName}</td>
								{#each data.semesterConfig.days as day}
									{@const dayAllBlocked = data.semesterConfig.starttimes.every(
										(/** @type {any} */ t) =>
											blockedMap.has(`${day.number}-${t.number}-${roomName}`)
									)}
									<td>
										<div class="flex items-center gap-0.5">
											{#each data.semesterConfig.starttimes as slot}
												{@const planned = isPlanned(day.number, slot.number, roomName)}
												{@const blockedReason = blockedMap.get(
													`${day.number}-${slot.number}-${roomName}`
												)}
												{@const isBlocked = blockedReason !== undefined}
												<button
													class="flex h-5 w-5 items-center justify-center rounded text-[10px] {isBlocked
														? 'bg-error/20 text-error line-through'
														: planned
															? 'bg-primary font-semibold text-primary-content'
															: 'bg-base-200 text-base-content/30 hover:bg-base-300'}"
													title={isBlocked
														? `gesperrt${blockedReason ? ': ' + blockedReason : ''} — klicken zum Entsperren`
														: `Tag ${day.number} · Slot ${slot.number}${planned ? ' · geplant' : ''} — klicken zum Sperren`}
													on:click={() => toggleBlock(day.number, slot.number, roomName)}
												>
													{slot.number}
												</button>
											{/each}
											<button
												class="ml-0.5 text-[9px] {dayAllBlocked
													? 'text-error'
													: 'text-base-content/30 hover:text-error'}"
												title={dayAllBlocked
													? 'ganzen Tag freigeben'
													: 'ganzen Tag für diesen Raum sperren'}
												on:click={() => toggleBlockDay(day.number, roomName)}
											>
												Tag
											</button>
										</div>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/key}
</div>
