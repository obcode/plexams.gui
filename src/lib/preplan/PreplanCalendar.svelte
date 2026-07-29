<script>
	import {
		roomColorMap,
		roomOrder,
		examBlocks,
		packByCapacity,
		packEqualLanes,
		weekGroups,
		timeRange,
		hhmm,
		minutesOfIso,
		dateKeyOfIso
	} from './calendar.js';

	/** Slot-Zeit → einheitlicher Key „YYYY-MM-DDTHH:MM" (Backend liefert Sekunden +
	 * Zeitzone; die Prüfungsblöcke rechnen in reinen hh:mm — beide Seiten hier
	 * über dieselben Helfer normalisieren). @param {string | null | undefined} iso */
	const slotKey = (iso) => {
		const dk = dateKeyOfIso(iso);
		const min = minutesOfIso(iso);
		return dk != null && min != null ? `${dk}T${hhmm(min)}` : String(iso ?? '');
	};

	let {
		/** @type {any[]} */ exams = [],
		/** @type {any[]} */ calendarSlots = [],
		/** @type {{ dateKey: string, room: string, startMin: number, endMin: number }[]} */
		annyBars = [],
		/** @type {{ dateKey: string, room: string, startMin: number, endMin: number, who: string }[]} */
		foreignBars = [],
		/** @type {{ dateKey: string, room: string, startMin: number, endMin: number, modules?: string[] }[]} */
		suggestedBars = [],
		/** @type {string[]} */ bookingRooms = [],
		/** @type {{ name: string, seats: number }[]} */ annyRooms = [],
		/** @type {string[]} */ selectedPrograms = []
	} = $props();

	// Fremde Anny-Buchungen einblenden: dann bekommt jeder Tag eine Spalte je Anny-Raum
	// und die fremden Buchungen erscheinen schwach schraffiert — die Lücken sind genau
	// das, was noch gebucht werden kann.
	let showForeign = $state(false);

	// Lesemodus: die Breite trägt keine Kapazitäts-Information mehr, sondern jede
	// gleichzeitige Prüfung bekommt eine gleich breite, lesbare Spur. Dafür braucht
	// ein Tag deutlich mehr Platz — die Woche scrollt dann horizontal und es stehen
	// nur noch ein bis drei Tage nebeneinander. Default ist die Kapazitätsansicht.
	let readable = $state(false);

	const ROOM_COL_PX = 16; // sehr schmale Raum-Spalte
	const LANE_PX = 190; // Mindestbreite einer Spur im Lesemodus
	// Im Lesemodus auch vertikal mehr Platz, sonst schneidet der Prüfungskern einer
	// kurzen Prüfung (60 Min → 48 px) die letzten Textzeilen ab.
	let pxPerMin = $derived(readable ? 1.3 : 0.8);

	let roomColors = $derived(roomColorMap([...bookingRooms, ...annyRooms.map((r) => r.name)]));
	/** @param {string} r */
	const colorOf = (r) => roomColors[r] ?? '#94a3b8';

	// eingeblendete Fremdbuchungen (leer, solange der Schalter aus ist)
	let shownForeign = $derived(showForeign ? (foreignBars ?? []) : []);

	let seatsByRoom = $derived(new Map(annyRooms.map((r) => [r.name, r.seats])));
	/** @param {string} r */
	const seatsOf = (r) => seatsByRoom.get(r) ?? 0;

	let blocks = $derived(examBlocks(exams));

	// Raum-Bedarf je Slot (normalisierte Startzeit) für Status-Punkt/Kapazität.
	let slotByStart = $derived(
		new Map((calendarSlots ?? []).map((/** @type {any} */ s) => [slotKey(s.starttime), s]))
	);
	/** Ampel wie in der Vorplanung. @param {any} n */
	function roomStatus(n) {
		if (!n || n.seatsNeeded === 0) return { level: 'neutral', dot: '⚪', text: 'kein Bedarf' };
		if (n.seatsNeeded > n.seatsAvailable)
			return { level: 'red', dot: '🔴', text: 'Kapazität reicht nicht' };
		if (n.seatsBooked >= n.seatsNeeded) return { level: 'green', dot: '🟢', text: 'genug gebucht' };
		return {
			level: 'yellow',
			dot: '🟡',
			text: `noch ${n.seatsNeeded - n.seatsBooked} Plätze`,
			toBook: n.roomsToBook ?? []
		};
	}
	/** Bedarf der Prüfung nach Art aus ihrem Slot ziehen. @param {any} b */
	function statusOf(b) {
		const s = slotByStart.get(`${b.dateKey}T${hhmm(b.examStart)}`);
		if (!s) return null;
		return roomStatus(b.examKind === 'SEB' ? s.seb : s.exahm);
	}

	// gemeinsame Zeitachse über Prüfungsfenster + Buchungen (fremde nur, wenn eingeblendet)
	let range = $derived(
		timeRange([
			...blocks.map((/** @type {any} */ b) => ({ start: b.winStart, end: b.winEnd })),
			...(annyBars ?? []).map((b) => ({ start: b.startMin, end: b.endMin })),
			...shownForeign.map((b) => ({ start: b.startMin, end: b.endMin })),
			...(suggestedBars ?? []).map((b) => ({ start: b.startMin, end: b.endMin }))
		])
	);
	let totalHeight = $derived((range.hi - range.lo) * pxPerMin);
	let hourMarks = $derived(
		(() => {
			/** @type {number[]} */
			const out = [];
			for (let h = Math.ceil(range.lo / 60); h <= Math.floor(range.hi / 60); h += 1) out.push(h);
			return out;
		})()
	);
	/** @param {number} min → px von oben */
	const top = (min) => (min - range.lo) * pxPerMin;

	// Wochen (Mo–Fr) aus allen Tagen mit Prüfung oder Buchung
	let weeks = $derived(
		weekGroups([
			...blocks.map((/** @type {any} */ b) => b.dateKey),
			...(annyBars ?? []).map((b) => b.dateKey),
			...shownForeign.map((b) => b.dateKey),
			...(suggestedBars ?? []).map((b) => b.dateKey)
		])
	);

	/**
	 * Kapazitätsanteil einer Prüfung: erwartete Studis / Plätze der tatsächlich
	 * gebuchten Räume des Slots (seatsBooked, je Art). 100 % = die gebuchten Räume
	 * sind voll — >100 % (gedeckelt) heißt zu wenig gebucht. Ist noch nichts gebucht,
	 * wird gegen den Bedarf normiert → die gleichzeitigen Prüfungen füllen die Zeile
	 * (Signal „Räume noch buchen"). @param {any} b
	 */
	function capacityOf(b) {
		const s = slotByStart.get(`${b.dateKey}T${hhmm(b.examStart)}`);
		const need = s ? (b.examKind === 'SEB' ? s.seb : s.exahm) : null;
		const booked = need?.seatsBooked ?? 0;
		const denom = booked > 0 ? booked : need?.seatsNeeded || b.expectedStudents || 1;
		return {
			booked,
			frac: b.expectedStudents / denom,
			pct: Math.round((b.expectedStudents / denom) * 100)
		};
	}

	// pro Tag: Prüfungsblöcke nach Kapazitätsanteil nebeneinander + Raum-Balken je Raum
	/** @param {string} dateKey */
	function dayData(dateKey) {
		const dayBlocks = blocks
			.filter((/** @type {any} */ b) => b.dateKey === dateKey)
			.map((/** @type {any} */ b) => {
				const cap = capacityOf(b);
				return {
					...b,
					start: b.winStart,
					end: b.winEnd,
					frac: cap.frac,
					capBooked: cap.booked,
					capPct: cap.pct
				};
			});
		// Lesemodus: gleich breite Spuren; sonst Breite = Kapazitätsanteil.
		const lanesPacked = readable ? packEqualLanes(dayBlocks) : null;
		const placed = lanesPacked ? lanesPacked.placed : packByCapacity(dayBlocks);
		const lanes = lanesPacked ? lanesPacked.lanes : 1;
		const bars = (annyBars ?? []).filter((b) => b.dateKey === dateKey);
		const foreign = shownForeign.filter((b) => b.dateKey === dateKey);
		const suggested = (suggestedBars ?? []).filter((b) => b.dateKey === dateKey);
		// Spalten: normal nur die Räume mit eigener Buchung/Vorschlag; mit eingeblendeten
		// Fremdbuchungen ALLE Anny-Räume, damit eine leere Spalte „noch frei" zeigt.
		const rooms = roomOrder(
			showForeign && annyRooms.length
				? annyRooms.map((r) => r.name)
				: [...bars, ...suggested].map((b) => b.room)
		);
		/** @type {Map<string, number>} */
		const roomCol = new Map(rooms.map((r, i) => [r, i]));
		return { blocks: placed, bars, foreign, suggested, rooms, roomCol, lanes };
	}

	/** @param {any} b passt die Prüfung zum aktiven Studiengang-Filter? */
	const matches = (b) =>
		!selectedPrograms.length ||
		(b.programs ?? []).some((/** @type {string} */ p) => selectedPrograms.includes(p));

	/** @param {string} kind — EXaHM rot, SEB blau */
	const coreClass = (kind) =>
		kind === 'SEB' ? 'bg-info/80 text-info-content' : 'bg-error/80 text-error-content';
	/** @param {string} kind Vor-/Nachlauf: schwacher Kasten in der Prüfungsfarbe */
	const windowClass = (kind) =>
		kind === 'SEB' ? 'border-info/40 bg-info/10' : 'border-error/40 bg-error/10';

	// Räume mit tatsächlich gezeichneten Balken (für die Legende); mit eingeblendeten
	// Fremdbuchungen sind das alle Anny-Räume, weil jeder eine Spalte bekommt.
	let legendRooms = $derived(
		roomOrder(
			showForeign && annyRooms.length
				? annyRooms.map((r) => r.name)
				: (annyBars ?? []).map((b) => b.room)
		)
	);

	// Offene Buchungen (gelb/rot) als knappe, handlungsleitende Liste unter dem Kalender
	let openNeeds = $derived(
		(calendarSlots ?? [])
			.flatMap((/** @type {any} */ s) =>
				[
					{ kind: 'EXaHM', need: s.exahm },
					{ kind: 'SEB', need: s.seb }
				]
					.filter((k) => k.need?.examCount > 0)
					.map((k) => ({
						starttime: s.starttime,
						kind: k.kind,
						st: roomStatus(k.need),
						need: k.need
					}))
			)
			.filter((x) => x.st.level === 'yellow' || x.st.level === 'red')
			.sort((a, b) => String(a.starttime).localeCompare(String(b.starttime)))
	);
	/** @param {string} iso → „Mo 13.07. 08:30" */
	const slotLabel = (iso) => {
		const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(String(iso ?? ''));
		if (!m) return String(iso ?? '');
		const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
		const wd = WD[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()];
		return `${wd} ${m[3]}.${m[2]}. ${m[4]}`;
	};
</script>

{#if !weeks.length}
	<div class="rounded-lg border border-base-300 p-6 text-center text-sm text-base-content/50">
		Noch keine Prüfungen in Slots eingeplant und keine Räume gebucht.
	</div>
{:else}
	<!-- Legende -->
	<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-3 rounded-sm bg-error/80"></span> EXaHM
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-3 rounded-sm bg-info/80"></span> SEB
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-4 rounded-sm border border-base-content/40 bg-base-content/10"
			></span> Vor-/Nachlauf
		</span>
		{#if readable}
			<span class="text-base-content/50">↔ Breite = gleich breite Spuren (Lesemodus)</span>
		{:else}
			<span class="text-base-content/50"
				>↔ Breite = Anteil an den gebuchten Plätzen (freie Breite = frei)</span
			>
		{/if}
		<label
			class="flex cursor-pointer items-center gap-1.5"
			title="Blöcke gleich breit und voll beschriftet; dafür passen nur noch ein bis drei Tage nebeneinander (die Woche scrollt horizontal)."
		>
			<input type="checkbox" class="toggle toggle-xs" bind:checked={readable} />
			<span class="text-base-content/70">Lesemodus</span>
		</label>
		<label
			class="flex cursor-pointer items-center gap-1.5"
			title="Buchungen anderer Personen schwach schraffiert einblenden; jeder Anny-Raum bekommt dann eine eigene Spalte — freie Fläche = der Raum ist zu der Zeit noch buchbar."
		>
			<input type="checkbox" class="toggle toggle-xs" bind:checked={showForeign} />
			<span class="text-base-content/70">fremde Buchungen</span>
		</label>
		<span class="text-base-content/30">|</span>
		<span class="text-base-content/50">{showForeign ? 'Anny-Räume:' : 'gebuchte Räume:'}</span>
		{#each legendRooms as r}
			<span class="flex items-center gap-1">
				<span class="inline-block h-3 w-3 rounded-sm" style="background:{colorOf(r)}"></span>
				<span class="font-mono">{r}</span>
			</span>
		{:else}
			<span class="text-base-content/40">— keine T-Raum-Buchung im Zeitraum</span>
		{/each}
		{#if showForeign}
			<span class="flex items-center gap-1" title="Buchung einer anderen Person — für uns belegt">
				<span
					class="inline-block h-3 w-3 rounded-sm opacity-40"
					style="background:repeating-linear-gradient(45deg,#94a3b8 0 1.5px,transparent 1.5px 5px)"
				></span>
				fremd (belegt) · leere Spalte = frei
			</span>
		{/if}
		{#if suggestedBars.length}
			<span class="flex items-center gap-1" title="Vorschlag: diesen Raum in Anny buchen">
				<span
					class="inline-block h-3 w-3 rounded-sm border-2 border-dashed"
					style="border-color:#94a3b8"
				></span>
				Buchungsvorschlag
			</span>
		{/if}
	</div>

	{#snippet dayColumn(/** @type {{ dateKey: string, label: string }} */ day)}
		{@const d = dayData(day.dateKey)}
		<!-- gestapelt (ein Tag pro Zeile) auf schmalen Screens, ab lg nebeneinander.
		     Im Lesemodus bekommt der Tag so viel Breite, dass jede Spur lesbar bleibt
		     (Zeitachse + Spuren + Raum-Spalte) — die Woche scrollt dann horizontal. -->
		<div
			class="lg:flex-1 {readable && d.blocks.length ? '' : 'lg:min-w-[150px]'}"
			style={readable && d.blocks.length
				? `min-width:${30 + d.lanes * LANE_PX + Math.max(d.rooms.length, 1) * ROOM_COL_PX}px`
				: ''}
		>
			<div class="h-6 text-center text-xs font-medium tabular-nums">{day.label}</div>
			<div class="flex" style="height:{totalHeight}px">
				<!-- schmale Zeitachse je Tag (funktioniert auch gestapelt) -->
				<div class="relative shrink-0" style="width:1.9rem">
					{#each hourMarks as h}
						<div
							class="absolute right-1 text-[10px] text-base-content/40 tabular-nums"
							style="top:{top(h * 60) - 6}px"
						>
							{h}
						</div>
					{/each}
				</div>
				<!-- Prüfungen (Fenster + Kern); Breite = Kapazitätsanteil, Rest bleibt frei -->
				<div
					class="relative flex-1 overflow-hidden rounded-l border-l border-base-200 bg-base-200/20"
				>
					{#each hourMarks as h}
						<div
							class="absolute inset-x-0 border-t border-base-200/60"
							style="top:{top(h * 60)}px"
						></div>
					{/each}
					{#each d.blocks as b (b.id)}
						{@const stt = statusOf(b)}
						<div
							class="absolute rounded border {windowClass(b.examKind)} {!selectedPrograms.length
								? ''
								: matches(b)
									? 'z-10 ring-2 ring-primary'
									: 'opacity-20 grayscale'}"
							style="top:{top(b.winStart)}px; height:{(b.winEnd - b.winStart) *
								pxPerMin}px; left:calc({b.left * 100}% + 1px); width:calc({b.width * 100}% - 2px)"
							title={`${b.examKind} · ${b.module} · ${b.expectedStudents} Studis${
								b.capBooked ? ` (${b.capPct}% von ${b.capBooked} gebuchten Plätzen)` : ''
							}${b.programs?.length ? ' · ' + b.programs.join(', ') : ''}${
								b.examerName ? ' · ' + b.examerName : ''
							}\n${hhmm(b.examStart)}–${hhmm(b.examEnd)}${b.durKnown ? '' : ' (Dauer geschätzt)'} · Vorlauf ${b.pre}/Nachlauf ${b.post} Min${
								stt ? '\nRäume: ' + stt.text : ''
							}${stt?.toBook?.length ? ' → ' + stt.toBook.join(', ') : ''}`}
						>
							<!-- solider Prüfungskern (Höhe = Dauer) -->
							<div
								class="absolute inset-x-0 overflow-hidden rounded px-1 py-0.5 leading-tight {readable
									? 'text-[11px]'
									: 'text-[10px]'} {coreClass(b.examKind)}"
								style="top:{b.pre * pxPerMin}px; height:{Math.max(b.dur * pxPerMin, 14)}px"
							>
								{#if readable}
									<!-- Lesemodus: nichts abgeschnitten — Modul umbricht, dazu Zeit,
									     Studis, Kapazität, Studiengänge und Prüfende:r. -->
									<div class="flex items-start gap-1 font-semibold">
										{#if stt && stt.level !== 'neutral'}<span>{stt.dot}</span>{/if}
										{#if b.isFixed}<span title="fixiert">🔒</span>{/if}
										<span>{b.module}</span>
									</div>
									<div class="tabular-nums opacity-90">
										{hhmm(b.examStart)}–{hhmm(b.examEnd)}{#if !b.durKnown}&nbsp;~{/if} ·
										{b.expectedStudents} Studis{#if b.capBooked}
											&nbsp;· {b.capPct}%{/if}
									</div>
									{#if b.programs?.length}
										<div class="opacity-90">
											{#each b.programs as p, i}{i ? ', ' : ''}<span
													class={selectedPrograms.includes(p) ? 'font-bold underline' : ''}
													>{p}</span
												>{/each}
										</div>
									{/if}
									{#if b.examerName}
										<div class="opacity-70">{b.examerName}</div>
									{/if}
								{:else}
									<div class="flex items-center gap-0.5">
										{#if stt && stt.level !== 'neutral'}<span>{stt.dot}</span>{/if}
										{#if b.isFixed}<span title="fixiert">🔒</span>{/if}
										<span class="truncate font-semibold">{b.module}</span>
										<span class="opacity-70 tabular-nums">{b.expectedStudents}</span>
										{#if b.capBooked && b.dur * pxPerMin > 26}
											<span class="opacity-60 tabular-nums">· {b.capPct}%</span>
										{/if}
									</div>
									{#if b.dur * pxPerMin > 26}
										<div class="truncate opacity-80 tabular-nums">
											{hhmm(b.examStart)}{#if !b.durKnown}
												~{/if}
										</div>
									{/if}
									{#if b.programs?.length && b.dur * pxPerMin > 38}
										<div class="truncate opacity-90">
											{#each b.programs as p, i}{i ? ', ' : ''}<span
													class={selectedPrograms.includes(p) ? 'font-bold underline' : ''}
													>{p}</span
												>{/each}
										</div>
									{/if}
								{/if}
							</div>
						</div>
					{/each}
				</div>
				<!-- gebuchte Räume: sehr schmale farbige Balken -->
				<div
					class="relative shrink-0 rounded-r border-l border-base-300 bg-base-200/40"
					style="width:{Math.max(d.rooms.length, 1) * ROOM_COL_PX}px"
				>
					{#each hourMarks as h}
						<div
							class="absolute inset-x-0 border-t border-base-200/60"
							style="top:{top(h * 60)}px"
						></div>
					{/each}
					<!-- eine Spalte je Raum (nur beschriftet über den Tooltip, 16 px sind zu
					     schmal für Text): die freie Fläche darin ist genau das Buchbare -->
					{#each d.rooms as r}
						{@const col = d.roomCol.get(r) ?? 0}
						<div
							class="absolute inset-y-0 border-l border-base-300/50"
							style="left:{col * ROOM_COL_PX}px; width:{ROOM_COL_PX}px"
							title={`${r}${seatsOf(r) ? ' · ' + seatsOf(r) + ' Plätze' : ''} — freie Fläche = in Anny noch buchbar`}
						></div>
					{/each}
					<!-- fremde Buchungen zuerst (liegen unter unseren): schwach schraffiert -->
					{#each d.foreign as bar}
						{@const col = d.roomCol.get(bar.room) ?? 0}
						<div
							class="absolute rounded-sm opacity-40"
							style="top:{top(bar.startMin)}px; height:{Math.max(
								(bar.endMin - bar.startMin) * pxPerMin,
								3
							)}px; left:{col * ROOM_COL_PX + 1}px; width:{ROOM_COL_PX -
								2}px; background:repeating-linear-gradient(45deg, {colorOf(
								bar.room
							)} 0 1.5px, transparent 1.5px 5px)"
							title={`${bar.room} · ${hhmm(bar.startMin)}–${hhmm(bar.endMin)} · fremd${
								bar.who ? ' (' + bar.who + ')' : ''
							} — für uns belegt`}
						></div>
					{/each}
					<!-- Buchungsvorschläge: gestrichelter Rahmen in der Raumfarbe -->
					{#each d.suggested as bar}
						{@const col = d.roomCol.get(bar.room) ?? 0}
						<div
							class="absolute rounded-sm border-2 border-dashed"
							style="top:{top(bar.startMin)}px; height:{Math.max(
								(bar.endMin - bar.startMin) * pxPerMin,
								6
							)}px; left:{col * ROOM_COL_PX}px; width:{ROOM_COL_PX}px; border-color:{colorOf(
								bar.room
							)}"
							title={`Vorschlag: ${bar.room} in Anny buchen · ${hhmm(bar.startMin)}–${hhmm(
								bar.endMin
							)}${bar.modules?.length ? ' · ' + bar.modules.join(', ') : ''}`}
						></div>
					{/each}
					{#each d.bars as bar}
						{@const col = d.roomCol.get(bar.room) ?? 0}
						<div
							class="absolute rounded-sm"
							style="top:{top(bar.startMin)}px; height:{Math.max(
								(bar.endMin - bar.startMin) * pxPerMin,
								4
							)}px; left:{col * ROOM_COL_PX + 1}px; width:{ROOM_COL_PX - 2}px; background:{colorOf(
								bar.room
							)}"
							title={`${bar.room} · ${hhmm(bar.startMin)}–${hhmm(bar.endMin)} · unsere Buchung`}
						></div>
					{/each}
				</div>
			</div>
		</div>
	{/snippet}

	<div class="flex flex-col gap-4">
		{#each weeks as week}
			<div class="rounded-lg border border-base-300 bg-base-100 p-2">
				<div class="mb-1 px-1 text-xs font-semibold text-base-content/60 tabular-nums">
					{week.rangeLabel}
				</div>
				<!-- schmal: ein Tag pro Zeile (gestapelt); ab lg: ganze Woche nebeneinander.
				     overflow-x-auto auch schmal, damit die breiten Lesemodus-Spalten
				     im Kasten scrollen statt die Seite zu sprengen. -->
				<div class="flex flex-col gap-3 overflow-x-auto lg:flex-row lg:gap-1.5">
					{#each week.days as day}
						{@render dayColumn(day)}
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Offene Buchungen (aus den Slot-Bedarfen abgeleitet) -->
	{#if openNeeds.length}
		<div class="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs">
			<div class="text-sm font-medium">🟡 Räume noch nicht ausreichend gebucht</div>
			{#each openNeeds as o}
				<div class="flex flex-wrap items-center gap-x-2 tabular-nums">
					<span>{o.st.dot}</span>
					<span class="font-medium">{slotLabel(o.starttime)}</span>
					<span class="badge badge-xs {o.kind === 'SEB' ? 'badge-info' : 'badge-error'}"
						>{o.kind}</span
					>
					<span class="text-base-content/70"
						>{o.need.seatsBooked}/{o.need.seatsNeeded} Plätze · {o.st.text}</span
					>
					{#if o.st.toBook?.length}
						<span class="text-warning">→ {o.st.toBook.join(', ')}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/if}
