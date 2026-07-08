<script>
	import {
		roomColorMap,
		roomOrder,
		examBlocks,
		packLanes,
		weekGroups,
		timeRange,
		hhmm
	} from './calendar.js';

	let {
		/** @type {any[]} */ exams = [],
		/** @type {any[]} */ calendarSlots = [],
		/** @type {{ dateKey: string, room: string, startMin: number, endMin: number }[]} */
		annyBars = [],
		/** @type {string[]} */ bookingRooms = [],
		/** @type {string[]} */ selectedPrograms = []
	} = $props();

	const PX_PER_MIN = 0.8;
	const ROOM_COL_PX = 16; // sehr schmale Raum-Spalte

	let roomColors = $derived(roomColorMap(bookingRooms));
	/** @param {string} r */
	const colorOf = (r) => roomColors[r] ?? '#94a3b8';

	let blocks = $derived(examBlocks(exams));

	// Raum-Bedarf je Slot (starttime) für Status-Punkt/Detail an der Prüfung.
	let slotByStart = $derived(
		new Map((calendarSlots ?? []).map((/** @type {any} */ s) => [s.starttime, s]))
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

	// gemeinsame Zeitachse über Prüfungsfenster + Buchungen
	let range = $derived(
		timeRange([
			...blocks.map((/** @type {any} */ b) => ({ start: b.winStart, end: b.winEnd })),
			...(annyBars ?? []).map((b) => ({ start: b.startMin, end: b.endMin }))
		])
	);
	let totalHeight = $derived((range.hi - range.lo) * PX_PER_MIN);
	let hourMarks = $derived(
		(() => {
			/** @type {number[]} */
			const out = [];
			for (let h = Math.ceil(range.lo / 60); h <= Math.floor(range.hi / 60); h += 1) out.push(h);
			return out;
		})()
	);
	/** @param {number} min → px von oben */
	const top = (min) => (min - range.lo) * PX_PER_MIN;

	// Wochen (Mo–Fr) aus allen Tagen mit Prüfung oder Buchung
	let weeks = $derived(
		weekGroups([
			...blocks.map((/** @type {any} */ b) => b.dateKey),
			...(annyBars ?? []).map((b) => b.dateKey)
		])
	);

	// pro Tag: Prüfungsblöcke in Spuren + Raum-Balken in Raum-Spalten
	/** @param {string} dateKey */
	function dayData(dateKey) {
		const dayBlocks = blocks.filter((/** @type {any} */ b) => b.dateKey === dateKey);
		const { placed, lanes } = packLanes(
			dayBlocks.map((/** @type {any} */ b) => ({ ...b, start: b.winStart, end: b.winEnd }))
		);
		const bars = (annyBars ?? []).filter((b) => b.dateKey === dateKey);
		const rooms = roomOrder(bars.map((b) => b.room));
		/** @type {Map<string, number>} */
		const roomCol = new Map(rooms.map((r, i) => [r, i]));
		return { blocks: placed, lanes, bars, rooms, roomCol };
	}

	/** @param {any} b passt die Prüfung zum aktiven Studiengang-Filter? */
	const matches = (b) =>
		!selectedPrograms.length ||
		(b.programs ?? []).some((/** @type {string} */ p) => selectedPrograms.includes(p));

	/** @param {string} kind */
	const coreClass = (kind) =>
		kind === 'SEB' ? 'bg-error/80 text-error-content' : 'bg-info/80 text-info-content';
	/** @param {string} kind Vor-/Nachlauf: schwacher Kasten in der Prüfungsfarbe */
	const windowClass = (kind) =>
		kind === 'SEB' ? 'border-error/40 bg-error/10' : 'border-info/40 bg-info/10';

	// Räume mit tatsächlich gezeichneten Balken (für die Legende)
	let legendRooms = $derived(roomOrder((annyBars ?? []).map((b) => b.room)));

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
			<span class="inline-block h-3 w-3 rounded-sm bg-info/80"></span> EXaHM
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-3 rounded-sm bg-error/80"></span> SEB
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-4 rounded-sm border border-base-content/40 bg-base-content/10"
			></span> Vor-/Nachlauf
		</span>
		<span class="text-base-content/30">|</span>
		<span class="text-base-content/50">gebuchte Räume:</span>
		{#each legendRooms as r}
			<span class="flex items-center gap-1">
				<span class="inline-block h-3 w-3 rounded-sm" style="background:{colorOf(r)}"></span>
				<span class="font-mono">{r}</span>
			</span>
		{:else}
			<span class="text-base-content/40">— keine T-Raum-Buchung im Zeitraum</span>
		{/each}
	</div>

	{#snippet dayColumn(/** @type {{ dateKey: string, label: string }} */ day)}
		{@const d = dayData(day.dateKey)}
		<!-- gestapelt (ein Tag pro Zeile) auf schmalen Screens, ab lg nebeneinander -->
		<div class="lg:min-w-[150px] lg:flex-1">
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
				<!-- Prüfungen (Fenster + Kern) -->
				<div class="relative flex-1 rounded-l border-l border-base-200 bg-base-200/20">
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
								PX_PER_MIN}px; left:calc({(b.lane / d.lanes) * 100}% + 1px); width:calc({100 /
								d.lanes}% - 2px)"
							title={`${b.examKind} · ${b.module} · ${b.expectedStudents} Studis${
								b.examerName ? ' · ' + b.examerName : ''
							}\n${hhmm(b.examStart)}–${hhmm(b.examEnd)}${b.durKnown ? '' : ' (Dauer geschätzt)'} · Vorlauf ${b.pre}/Nachlauf ${b.post} Min${
								stt ? '\nRäume: ' + stt.text : ''
							}${stt?.toBook?.length ? ' → ' + stt.toBook.join(', ') : ''}`}
						>
							<!-- solider Prüfungskern (Höhe = Dauer) -->
							<div
								class="absolute inset-x-0 overflow-hidden rounded px-1 py-0.5 text-[10px] leading-tight {coreClass(
									b.examKind
								)}"
								style="top:{b.pre * PX_PER_MIN}px; height:{Math.max(b.dur * PX_PER_MIN, 14)}px"
							>
								<div class="flex items-center gap-0.5">
									{#if stt && stt.level !== 'neutral'}<span>{stt.dot}</span>{/if}
									{#if b.isFixed}<span title="fixiert">🔒</span>{/if}
									<span class="truncate font-semibold">{b.module}</span>
									<span class="opacity-70 tabular-nums">{b.expectedStudents}</span>
								</div>
								{#if b.dur * PX_PER_MIN > 26}
									<div class="truncate opacity-80 tabular-nums">
										{hhmm(b.examStart)}{#if !b.durKnown}
											~{/if}
									</div>
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
					{#each d.bars as bar}
						{@const col = d.roomCol.get(bar.room) ?? 0}
						<div
							class="absolute rounded-sm"
							style="top:{top(bar.startMin)}px; height:{Math.max(
								(bar.endMin - bar.startMin) * PX_PER_MIN,
								4
							)}px; left:{col * ROOM_COL_PX + 1}px; width:{ROOM_COL_PX - 2}px; background:{colorOf(
								bar.room
							)}"
							title={`${bar.room} · ${hhmm(bar.startMin)}–${hhmm(bar.endMin)}`}
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
				<!-- schmal: ein Tag pro Zeile (gestapelt); ab lg: ganze Woche nebeneinander -->
				<div class="flex flex-col gap-3 lg:flex-row lg:gap-1.5 lg:overflow-x-auto">
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
					<span class="badge badge-xs {o.kind === 'SEB' ? 'badge-error' : 'badge-info'}"
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
