<script>
	import { invalidateAll } from '$app/navigation';
	import StreamAction from '$lib/zpa/StreamAction.svelte';
	import WriteButton from '$lib/WriteButton.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';
	import { roomColorMap, roomOrder as sortRooms } from '$lib/preplan/calendar.js';

	let { data } = $props();
	let bookings = $derived(data.bookings || []);
	let slots = $derived(data.slots || []);
	let roomOrder = $derived(data.roomOrder || []);
	let annyRooms = $derived(sortRooms(data.annyRooms || []));
	let examDays = $derived(data.examDays || []);

	/** @type {'calendar' | 'list' | 'matrix'} */
	let view = $state('calendar');

	// --- Filter (Kalender + Liste), Defaults: nur meine + nur Prüfungszeitraum ---
	let onlyMine = $state(true);
	let onlyExamPeriod = $state(true);
	let roomFilter = $state('all');
	let q = $state('');

	let examMin = $derived(examDays.length ? examDays[0].date : null);
	let examMax = $derived(examDays.length ? examDays[examDays.length - 1].date : null);
	/** @param {any} b */
	const inExamPeriod = (b) =>
		!examMin || !examMax || (b.dateKey && b.dateKey >= examMin && b.dateKey <= examMax);

	let mineCount = $derived(bookings.filter((/** @type {any} */ b) => b.mine).length);
	let roomsInBookings = $derived(sortRooms(bookings.map((/** @type {any} */ b) => b.room)));

	let filtered = $derived(
		bookings.filter((/** @type {any} */ b) => {
			if (onlyMine && !b.mine) return false;
			if (onlyExamPeriod && !inExamPeriod(b)) return false;
			if (roomFilter !== 'all' && b.room !== roomFilter) return false;
			if (q.trim()) {
				const t = q.trim().toLowerCase();
				const hay =
					`${b.personalizationName ?? ''} ${b.description ?? ''} ${b.room ?? ''} ${b.number ?? ''}`.toLowerCase();
				if (!hay.includes(t)) return false;
			}
			return true;
		})
	);

	// --- Raum-Farben (kategoriale Palette, geteilt mit dem Preplan-Kalender) ---
	let roomColors = $derived(roomColorMap(roomsInBookings));
	let legendRooms = $derived(sortRooms(filtered.map((/** @type {any} */ b) => b.room)));

	// --- Kalender aufbauen ---
	const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	/** @param {string} dateKey → „Mo 06.07." */
	function dayLabel(dateKey) {
		const [y, m, d] = dateKey.split('-').map(Number);
		if (!y) return dateKey;
		const dt = new Date(Date.UTC(y, m - 1, d));
		return `${WD[dt.getUTCDay()]} ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
	}
	/** @param {string} dateKey → UTC-Date */
	const parseKey = (dateKey) => {
		const [y, m, d] = dateKey.split('-').map(Number);
		return new Date(Date.UTC(y, m - 1, d));
	};
	/** @param {Date} dt → „YYYY-MM-DD" */
	const fmtKey = (dt) =>
		`${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
			dt.getUTCDate()
		).padStart(2, '0')}`;
	/** @param {string} dateKey → Montag derselben Kalenderwoche (als dateKey) */
	function mondayOf(dateKey) {
		const dt = parseKey(dateKey);
		const dow = dt.getUTCDay(); // 0=So … 6=Sa
		const diff = dow === 0 ? -6 : 1 - dow;
		dt.setUTCDate(dt.getUTCDate() + diff);
		return fmtKey(dt);
	}
	/** @param {number} min */
	const hhmm = (min) =>
		`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

	// Spalten = Prüfungstage; ohne Prüfungszeitraum-Filter auch Tage außerhalb.
	let calendarDates = $derived(
		(() => {
			const set = new Set(examDays.map((/** @type {any} */ d) => d.date));
			if (!onlyExamPeriod || set.size === 0) {
				for (const b of filtered) if (b.dateKey) set.add(b.dateKey);
			}
			return [...set].sort();
		})()
	);

	let calBookings = $derived(
		filtered.filter(
			(/** @type {any} */ b) =>
				b.startMin != null &&
				b.endMin != null &&
				b.room &&
				b.dateKey &&
				calendarDates.includes(b.dateKey)
		)
	);
	/** @param {string | null} room */
	const colorOf = (room) => (room && roomColors[room]) || '#94a3b8';

	const PX_PER_MIN = 0.7;
	let timeRange = $derived(
		(() => {
			let lo = Infinity;
			let hi = -Infinity;
			for (const b of calBookings) {
				if (b.startMin == null || b.endMin == null) continue;
				lo = Math.min(lo, b.startMin);
				hi = Math.max(hi, b.endMin);
			}
			if (!Number.isFinite(lo)) {
				lo = 8 * 60;
				hi = 18 * 60;
			}
			lo = Math.floor(lo / 60) * 60;
			hi = Math.ceil(hi / 60) * 60;
			if (hi - lo < 120) hi = lo + 120;
			return { lo, hi };
		})()
	);
	let totalHeight = $derived((timeRange.hi - timeRange.lo) * PX_PER_MIN);
	let hourMarks = $derived(
		(() => {
			const out = [];
			for (let h = Math.ceil(timeRange.lo / 60); h <= Math.floor(timeRange.hi / 60); h += 1)
				out.push(h);
			return out;
		})()
	);

	// Pro Tag in Spuren packen — nach Raum gruppiert in fester Legenden-Reihenfolge
	// (sortRooms), damit die Spalten der Kalenderübersicht der Legende entsprechen.
	// Je Raum eine Spur; nur bei zeitlicher Überlappung desselben Raums mehrere.
	let calendar = $derived(
		calendarDates.map((date) => {
			const dayBookings = calBookings.filter((/** @type {any} */ b) => b.dateKey === date);
			const rooms = sortRooms(dayBookings.map((/** @type {any} */ b) => b.room));
			/** @type {any[]} */
			const placed = [];
			let laneOffset = 0;
			for (const room of rooms) {
				const roomBookings = dayBookings
					.filter((/** @type {any} */ b) => b.room === room)
					.sort(
						(/** @type {any} */ a, /** @type {any} */ b) =>
							a.startMin - b.startMin || a.endMin - b.endMin
					);
				/** @type {number[]} */
				const laneEnds = [];
				for (const b of roomBookings) {
					let lane = laneEnds.findIndex((end) => end <= b.startMin);
					if (lane === -1) {
						lane = laneEnds.length;
						laneEnds.push(b.endMin);
					} else {
						laneEnds[lane] = b.endMin;
					}
					placed.push({ ...b, lane: laneOffset + lane });
				}
				laneOffset += Math.max(1, laneEnds.length);
			}
			return {
				date,
				label: dayLabel(date),
				dayNumber: examDays.find((/** @type {any} */ d) => d.date === date)?.dayNumber,
				bookings: placed,
				lanes: Math.max(1, laneOffset)
			};
		})
	);

	// Kalender wochenweise (immer Mo–Fr) untereinander gruppieren.
	let calendarWeeks = $derived(
		(() => {
			/** @type {Map<string, Map<string, any>>} */
			const byMonday = new Map();
			for (const day of calendar) {
				const mk = mondayOf(day.date);
				if (!byMonday.has(mk)) byMonday.set(mk, new Map());
				byMonday.get(mk)?.set(day.date, day);
			}
			return [...byMonday.keys()].sort().map((mk) => {
				const dayMap = byMonday.get(mk) ?? new Map();
				const monday = parseKey(mk);
				/** @param {string} dk */
				const emptyDay = (dk) => ({
					date: dk,
					label: dayLabel(dk),
					dayNumber: undefined,
					bookings: [],
					lanes: 1
				});
				/** @type {Set<string>} */
				const seen = new Set();
				const days = [];
				// Immer Mo–Fr, auch ohne Buchungen.
				for (let i = 0; i < 5; i += 1) {
					const dt = new Date(
						Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + i)
					);
					const dk = fmtKey(dt);
					seen.add(dk);
					days.push(dayMap.get(dk) ?? emptyDay(dk));
				}
				// Etwaige Buchungen am Wochenende nicht verlieren.
				for (const [dk, day] of [...dayMap.entries()].sort()) {
					if (!seen.has(dk)) days.push(day);
				}
				days.sort((a, b) => a.date.localeCompare(b.date));
				const friday = new Date(
					Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 4)
				);
				return { monday: mk, rangeLabel: `${dayLabel(mk)} – ${dayLabel(fmtKey(friday))}`, days };
			});
		})()
	);

	// --- Slot-Matrix: Filter ---
	let hideEmpty = $state(true);
	/** @type {number[]} */
	let selectedDays = $state([]);
	let availableDays = $derived(
		[...new Set(slots.map((/** @type {any} */ s) => Number(s.day)))].sort(
			(/** @type {number} */ a, /** @type {number} */ b) => a - b
		)
	);
	/** @param {number} d */
	const toggleDay = (d) =>
		(selectedDays = selectedDays.includes(d)
			? selectedDays.filter((x) => x !== d)
			: [...selectedDays, d]);
	let filteredSlots = $derived(
		slots.filter((/** @type {any} */ s) => {
			if (selectedDays.length && !selectedDays.includes(Number(s.day))) return false;
			if (hideEmpty) return Number(s.coveredRooms || 0) > 0;
			return true;
		})
	);

	// --- Namen pflegen (personalizationNames → wirkt auf mine) ---
	/** @type {string[]} */
	let names = $state([...(data.personalizationNames || [])]);
	let newName = $state('');
	let savingNames = $state(false);
	let namesError = $state('');
	let namesDirty = $derived(
		JSON.stringify(names) !== JSON.stringify(data.personalizationNames || [])
	);

	function addName() {
		const n = newName.trim();
		if (n && !names.includes(n)) names = [...names, n];
		newName = '';
	}
	/** @param {string} n */
	const rmName = (n) => (names = names.filter((x) => x !== n));

	async function saveNames() {
		if (savingNames) return;
		savingNames = true;
		namesError = '';
		try {
			const res = await fetch('/api/room/setAnnyPersonalizationNames', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ names })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				namesError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll(); // mine wird beim Query neu berechnet
			names = [...(data.personalizationNames || [])];
		} catch (e) {
			namesError = e instanceof Error ? e.message : String(e);
		} finally {
			savingNames = false;
		}
	}

	/** @param {string | Date | null | undefined} value */
	function fmtTime(value) {
		if (!value) return '--:--';
		const raw = String(value);
		const localIsoMatch = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/);
		if (localIsoMatch) return localIsoMatch[1];
		const parsed = new Date(raw);
		if (Number.isNaN(parsed.getTime())) return '--:--';
		return parsed.toLocaleTimeString('de-DE', {
			timeZone: 'Europe/Berlin',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	/** @param {string | Date | null | undefined} date */
	function fmtDate(date) {
		if (!date) return '--';
		const raw = String(date);
		const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (m) return `${m[3]}.${m[2]}.${m[1]}`;
		const d = new Date(raw);
		return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString('de-DE');
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Anny-Buchungen</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{bookings.length}</span>
		{#if mineCount}
			<span class="badge badge-secondary badge-lg tabular-nums">{mineCount} meine</span>
		{/if}
	</div>

	<!-- Abrufen + Namen pflegen -->
	<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
		<StreamAction
			field="importAnnyBookings"
			title="Anny-Buchungen abrufen"
			description="Holt die aktuellen Buchungen aus Anny (Log-Stream) und lädt die Ansicht neu."
			accent="info"
			actionLabel="Abrufen"
			ondone={() => invalidateAll()}
		/>

		<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
			<div class="flex items-center gap-2">
				<span class="font-medium">Eigene Namen</span>
				<span class="text-xs text-base-content/50">
					bestimmen, welche Buchungen als „meine" gelten
				</span>
			</div>
			<div class="flex flex-wrap items-center gap-1.5">
				{#each names as n}
					<span class="badge badge-neutral gap-1">
						{n}
						<button class="text-error" title="entfernen" onclick={() => rmName(n)}>✕</button>
					</span>
				{:else}
					<span class="text-sm text-base-content/40">— noch keine Namen</span>
				{/each}
			</div>
			<div class="flex items-center gap-2">
				<input
					class="input input-bordered input-sm flex-1"
					type="text"
					bind:value={newName}
					onkeydown={(e) => e.key === 'Enter' && addName()}
					placeholder="Name hinzufügen (z. B. Vorname Nachname)"
				/>
				<button class="btn btn-ghost btn-sm" disabled={!newName.trim()} onclick={addName}>＋</button
				>
				<WriteButton
					class="btn btn-primary btn-sm"
					disabled={savingNames || !namesDirty}
					onclick={saveNames}
				>
					{savingNames ? 'speichert …' : 'Speichern'}
				</WriteButton>
			</div>
			{#if namesError}
				<div class="alert alert-error py-1.5 text-xs"><span>{namesError}</span></div>
			{/if}
		</div>
	</div>

	<!-- Anny-Räume (requestWith: ANNY, auf der Räume-Seite gepflegt) -->
	<div class="flex flex-wrap items-center gap-2 text-sm">
		<span class="text-base-content/60">Anny-Räume:</span>
		{#each annyRooms as r}
			<span class="badge badge-outline badge-sm font-mono">{r}</span>
		{:else}
			<span class="text-base-content/40">— keine (auf der Räume-Seite via „Anforderung: Anny")</span
			>
		{/each}
		<a href="/rooms" class="link link-hover text-xs text-base-content/50">pflegen →</a>
	</div>

	<!-- Ansicht umschalten -->
	<div class="tabs tabs-boxed w-fit">
		<button
			class="tab {view === 'calendar' ? 'tab-active' : ''}"
			onclick={() => (view = 'calendar')}
		>
			📅 Kalender
		</button>
		<button class="tab {view === 'list' ? 'tab-active' : ''}" onclick={() => (view = 'list')}>
			Liste
		</button>
		<button class="tab {view === 'matrix' ? 'tab-active' : ''}" onclick={() => (view = 'matrix')}>
			Slot-Matrix
		</button>
	</div>

	{#if view !== 'matrix'}
		<!-- Gemeinsame Filter für Kalender + Liste -->
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
		>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" class="toggle toggle-secondary toggle-sm" bind:checked={onlyMine} />
				<span>nur meine</span>
			</label>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input
					type="checkbox"
					class="toggle toggle-primary toggle-sm"
					bind:checked={onlyExamPeriod}
				/>
				<span>nur Prüfungszeitraum</span>
			</label>
			<select class="select select-bordered select-sm" bind:value={roomFilter}>
				<option value="all">alle Räume</option>
				{#each roomsInBookings as r}
					<option value={r}>{r}</option>
				{/each}
			</select>
			<input
				class="input input-bordered input-sm w-56"
				type="text"
				bind:value={q}
				placeholder="Suche (Name, Beschreibung, Raum, Nr.) …"
			/>
			<div class="flex-1"></div>
			<span class="text-sm text-base-content/50 tabular-nums">{filtered.length} angezeigt</span>
		</div>
	{/if}

	{#if view === 'calendar'}
		<!-- Raum-Legende -->
		{#if legendRooms.length}
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
				{#each legendRooms as r}
					<span class="flex items-center gap-1 text-xs">
						<span class="inline-block h-3 w-3 rounded-sm" style="background:{roomColors[r]}"></span>
						<span class="font-mono">{r}</span>
					</span>
				{/each}
			</div>
		{/if}

		{#if calBookings.length === 0}
			<div class="rounded-lg border border-base-300 p-8 text-center text-sm text-base-content/50">
				Keine Buchungen im gewählten Zeitraum.
			</div>
		{:else}
			<div class="flex flex-col gap-4">
				{#each calendarWeeks as week}
					<div class="overflow-x-auto rounded-lg border border-base-300 bg-base-100 p-2">
						<div class="mb-1 px-1 text-xs font-semibold text-base-content/60 tabular-nums">
							{week.rangeLabel}
						</div>
						<div class="flex min-w-fit">
							<!-- Zeit-Spalte -->
							<div class="shrink-0 pr-1" style="width:3rem">
								<div class="h-6"></div>
								<div class="relative" style="height:{totalHeight}px">
									{#each hourMarks as h}
										<div
											class="absolute right-1 text-[10px] text-base-content/40"
											style="top:{(h * 60 - timeRange.lo) * PX_PER_MIN - 6}px"
										>
											{h}:00
										</div>
									{/each}
								</div>
							</div>
							<!-- Tages-Spalten -->
							<div class="flex flex-1 gap-1">
								{#each week.days as day}
									<div class="min-w-[130px] flex-1">
										<div class="h-6 text-center text-xs font-medium tabular-nums">
											{day.label}
											{#if day.date}<span class="text-base-content/40"
													>· {mkDateShort(day.date)}</span
												>{/if}
										</div>
										<div
											class="relative rounded border-l border-base-200 bg-base-200/20"
											style="height:{totalHeight}px"
										>
											{#each hourMarks as h}
												<div
													class="absolute inset-x-0 border-t border-base-200/60"
													style="top:{(h * 60 - timeRange.lo) * PX_PER_MIN}px"
												></div>
											{/each}
											{#each day.bookings as b}
												<div
													class="absolute overflow-hidden rounded px-1 py-0.5 text-[10px] leading-tight"
													style="top:{(b.startMin - timeRange.lo) * PX_PER_MIN}px; height:{Math.max(
														(b.endMin - b.startMin) * PX_PER_MIN,
														16
													)}px; left:calc({(b.lane / day.lanes) * 100}% + 1px); width:calc({100 /
														day.lanes}% - 2px); background:{colorOf(
														b.room
													)}; color:#1e1e2e; outline:{b.mine ? '2px solid currentColor' : 'none'}"
													title={`${b.room} · ${fmtTime(b.startDate)}–${fmtTime(b.endDate)}${
														b.personalizationName ? ' · ' + b.personalizationName : ''
													}${b.description ? ' · ' + b.description : ''}`}
												>
													<div class="font-mono font-semibold">{b.room}</div>
													<div class="tabular-nums">{fmtTime(b.startDate)}</div>
													{#if (b.endMin - b.startMin) * PX_PER_MIN > 34 && b.personalizationName}
														<div class="truncate">{b.personalizationName}</div>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else if view === 'list'}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th class="bg-base-200">Datum</th>
						<th class="bg-base-200">Zeit</th>
						<th class="bg-base-200">Raum</th>
						<th class="bg-base-200">Wer</th>
						<th class="bg-base-200">Beschreibung</th>
						<th class="bg-base-200">Status</th>
					</tr>
				</thead>
				<tbody>
					{#if filtered.length === 0}
						<tr>
							<td colspan="6" class="py-8 text-center text-sm text-base-content/50">
								Keine Buchungen gefunden
							</td>
						</tr>
					{:else}
						{#each filtered as b}
							<tr class="hover {b.mine ? 'bg-secondary/10' : ''}">
								<td class="tabular-nums whitespace-nowrap">{fmtDate(b.startDate)}</td>
								<td class="tabular-nums whitespace-nowrap">
									{fmtTime(b.startDate)}–{fmtTime(b.endDate)}
								</td>
								<td class="font-mono whitespace-nowrap">
									<span class="inline-flex items-center gap-1">
										<span
											class="inline-block h-2.5 w-2.5 rounded-sm"
											style="background:{colorOf(b.room)}"
										></span>
										{b.room ?? '—'}
									</span>
								</td>
								<td class="whitespace-nowrap">
									{b.personalizationName ?? '—'}
									{#if b.mine}<span class="badge badge-secondary badge-xs ml-1">meine</span>{/if}
								</td>
								<td class="max-w-[28rem] truncate" title={b.description}>{b.description || '—'}</td>
								<td>
									<span class="badge badge-ghost badge-sm">{b.status}</span>
									{#if b.isBlocker}<span class="badge badge-warning badge-sm ml-1">Blocker</span
										>{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{:else}
		<!-- Slot-Matrix: T-Raum-Abdeckung je Prüfungsslot -->
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
		>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" class="toggle toggle-primary toggle-sm" bind:checked={hideEmpty} />
				<span>nur Slots mit T-Raum-Abdeckung</span>
			</label>
			<div class="flex-1"></div>
			<div class="flex flex-wrap items-center gap-1">
				<span class="text-sm text-base-content/50">Tage:</span>
				{#each availableDays as day}
					<button
						class="badge gap-1 tabular-nums {selectedDays.includes(day)
							? 'badge-primary'
							: 'badge-ghost'}"
						onclick={() => toggleDay(day)}
					>
						{day}
					</button>
				{/each}
				{#if selectedDays.length}
					<button class="btn btn-ghost btn-xs" onclick={() => (selectedDays = [])}>alle</button>
				{/if}
			</div>
		</div>

		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th class="bg-base-200 sticky left-0 z-10">Slot</th>
						{#each roomOrder as room}
							<th class="font-mono">{room}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#if filteredSlots.length === 0}
						<tr>
							<td
								colspan={roomOrder.length + 1}
								class="py-8 text-center text-sm text-base-content/50"
							>
								Keine passenden Slots gefunden
							</td>
						</tr>
					{:else}
						{#each filteredSlots as slot}
							<tr class="hover">
								<td class="bg-base-100 sticky left-0 z-10 min-w-[170px] align-top">
									<div class="font-medium tabular-nums">
										{fmtDate(slot.date)}
										{slot.start || ''}
									</div>
									<div class="text-xs text-base-content/50">
										{slot.date ? mkDateShort(slot.date) : '—'} · {slot.start
											? slot.start.slice(0, 5)
											: '—'}
									</div>
									<div class="mt-1">
										<span
											class="badge badge-sm tabular-nums {Number(slot.coveredRooms) > 0
												? 'badge-success'
												: 'badge-ghost'}"
										>
											{slot.coveredRooms} T-Räume belegt
										</span>
									</div>
								</td>
								{#each roomOrder as room}
									<td class="min-w-[230px] align-top">
										{#if (slot.bookingsByRoom[room] || []).length === 0}
											<span class="text-base-content/20">—</span>
										{:else}
											<div class="flex flex-col gap-1.5">
												{#each slot.bookingsByRoom[room] || [] as b}
													<div class="rounded-lg border border-base-300 bg-base-200/40 p-2">
														<div class="text-sm font-medium tabular-nums">
															{fmtTime(b.startDate)} – {fmtTime(b.endDate)}
														</div>
														{#if b.description}
															<div class="mt-0.5 text-xs text-base-content/60">{b.description}</div>
														{/if}
													</div>
												{/each}
											</div>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
