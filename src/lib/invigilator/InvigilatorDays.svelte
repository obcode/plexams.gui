<script>
	export let semesterConfig;
	export let invigilator;
	// when false, only own exams are drawn (the Aufsicht/Reserve blocks are hidden)
	export let showInvigilations = true;
	import { mkDateShort } from '$lib/jshelper/misc';
	const requirements = invigilator.requirements;

	const timeWindows = requirements?.timeWindows ?? [];
	const excludedDays = requirements?.excludedDays ?? [];
	/** @type {{ from: string, until: string }[]} */
	const examTimes = [
		...new Map(
			(requirements?.examTimes ?? []).map((/** @type {{ from: string, until: string }} */ et) => [
				`${et.from}-${et.until}`,
				et
			])
		).values()
	];
	const invigilations = invigilator.todos?.invigilations ?? [];

	/**
	 * @param {string} datetime
	 */
	function twTime(datetime) {
		const m = String(datetime).match(/T(\d{2}:\d{2})/);
		return m ? m[1] : '';
	}
	/**
	 * @param {string} datetime
	 * @returns {number}
	 */
	function toMinutes(datetime) {
		const m = String(datetime).match(/T(\d{2}):(\d{2})/);
		return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
	}
	/**
	 * @param {string} datetime
	 */
	function dateKey(datetime) {
		return String(datetime).slice(0, 10);
	}
	/**
	 * @param {number} minutes
	 */
	function fmtMin(minutes) {
		return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
	}

	// slotNumber -> start minutes (from semester starttimes)
	/** @type {Map<number, number>} */
	const slotStartMin = new Map();
	for (const s of semesterConfig.starttimes ?? []) {
		slotStartMin.set(s.number, toMinutes(`T${s.start}`));
	}

	// self-invigilations (the person supervises their own exam) — used to colour the
	// matching exam green instead of rendering a separate (zero-duration) block.
	const selfInvigSlots = invigilations
		.filter((/** @type {{ isSelfInvigilation: boolean }} */ inv) => inv.isSelfInvigilation)
		.map((/** @type {{ slot: { dayNumber: number, slotNumber: number } }} */ inv) => ({
			day: inv.slot.dayNumber,
			min: slotStartMin.get(inv.slot.slotNumber) ?? 0
		}));

	// time axis for the calendar
	const SLOT_DURATION = 120;
	const PX_PER_MIN = 0.5;
	const startMinutes = [...slotStartMin.values()];
	let calMin = startMinutes.length ? Math.min(...startMinutes) : 8 * 60;
	let calMax = startMinutes.length ? Math.max(...startMinutes) + SLOT_DURATION : 18 * 60;
	for (const tw of timeWindows) {
		if (tw.from) calMin = Math.min(calMin, toMinutes(tw.from));
		if (tw.until) calMax = Math.max(calMax, toMinutes(tw.until));
	}
	for (const et of examTimes) {
		calMin = Math.min(calMin, toMinutes(et.from));
		calMax = Math.max(calMax, toMinutes(et.until));
	}
	calMin = Math.floor(calMin / 60) * 60;
	calMax = Math.ceil(calMax / 60) * 60;
	const calHeight = (calMax - calMin) * PX_PER_MIN;
	/** @type {number[]} */
	const calHours = [];
	// note: stop *before* calMax — a label exactly at the bottom edge would sit
	// outside the grid (over the legend) and the bottom border already marks the end.
	for (let h = calMin; h < calMax; h += 60) {
		calHours.push(h);
	}
	/**
	 * @param {number} minutes
	 */
	function calTop(minutes) {
		return (minutes - calMin) * PX_PER_MIN;
	}

	/**
	 * Time windows of a day, resolved to numeric [startMin, endMin].
	 * Missing `from` means "from start of day", missing `until` means "until end of day".
	 * @param {{ date: string }} day
	 */
	function windowsForDay(day) {
		return timeWindows
			.filter((/** @type {{ date: string }} */ tw) => dateKey(tw.date) === dateKey(day.date))
			.map((/** @type {{ from: string | null, until: string | null }} */ tw) => ({
				startMin: tw.from ? toMinutes(tw.from) : calMin,
				endMin: tw.until ? toMinutes(tw.until) : calMax,
				label: `${tw.from ? twTime(tw.from) : 'Beginn'}–${tw.until ? twTime(tw.until) : 'Ende'}`
			}));
	}

	/**
	 * The parts of a day NOT covered by any time window (rendered red, like an
	 * excluded day). Empty when the day has no time windows.
	 * @param {{ date: string }} day
	 */
	function redIntervalsForDay(day) {
		const wins = windowsForDay(day);
		if (!wins.length) return [];
		const sorted = [...wins].sort((a, b) => a.startMin - b.startMin);
		/** @type {{ startMin: number, endMin: number }[]} */
		const merged = [];
		for (const w of sorted) {
			const last = merged[merged.length - 1];
			if (last && w.startMin <= last.endMin) {
				last.endMin = Math.max(last.endMin, w.endMin);
			} else {
				merged.push({ startMin: w.startMin, endMin: w.endMin });
			}
		}
		/** @type {{ startMin: number, endMin: number }[]} */
		const red = [];
		let cursor = calMin;
		for (const m of merged) {
			if (m.startMin > cursor) red.push({ startMin: cursor, endMin: m.startMin });
			cursor = Math.max(cursor, m.endMin);
		}
		if (cursor < calMax) red.push({ startMin: cursor, endMin: calMax });
		return red;
	}

	/**
	 * Foreground events (own exams + invigilations) for one day, with side-by-side
	 * lane layout so overlapping blocks (e.g. own exam + self-invigilation) stay readable.
	 * @param {{ number: number, date: string }} day
	 * @param {boolean} withInvigilations  passed in (not closed over) so the template
	 *   call re-runs reactively when the toggle changes
	 */
	function eventsForDay(day, withInvigilations) {
		/** @type {{ startMin: number, endMin: number, label: string, from: string, until: string, title: string, cls: string }[]} */
		const events = [];
		// own exams (exact times from examTimes); green if self-invigilated, else blue
		for (const et of examTimes) {
			if (dateKey(et.from) !== dateKey(day.date)) continue;
			const startMin = toMinutes(et.from);
			const endMin = toMinutes(et.until);
			const isSelf = selfInvigSlots.some(
				(/** @type {{ day: number, min: number }} */ s) =>
					s.day === day.number && s.min >= startMin && s.min < endMin
			);
			events.push({
				startMin,
				endMin,
				label: 'Prüfung',
				from: fmtMin(startMin),
				until: fmtMin(endMin),
				title: `Eigene Prüfung ${fmtMin(startMin)}–${fmtMin(endMin)}${isSelf ? ' (Eigenaufsicht)' : ''}`,
				cls: isSelf ? 'bg-violet-300' : 'bg-sky-300'
			});
		}
		// invigilations (self-invigilations are shown via the green exam above)
		for (const inv of withInvigilations ? invigilations : []) {
			if (inv.slot?.dayNumber !== day.number) continue;
			if (inv.isSelfInvigilation) continue;
			const startMin = slotStartMin.get(inv.slot.slotNumber) ?? 0;
			const endMin = startMin + (inv.duration > 0 ? inv.duration : SLOT_DURATION);
			if (inv.isReserve) {
				events.push({
					startMin,
					endMin,
					label: 'Reserve',
					from: fmtMin(startMin),
					until: fmtMin(endMin),
					title: `Reserveaufsicht ${fmtMin(startMin)}–${fmtMin(endMin)}`,
					cls: 'bg-yellow-300'
				});
			} else {
				events.push({
					startMin,
					endMin,
					label: inv.roomName ?? 'Aufsicht',
					from: fmtMin(startMin),
					until: fmtMin(endMin),
					title: `Aufsicht ${inv.roomName ?? ''} ${fmtMin(startMin)}–${fmtMin(endMin)}`,
					cls: 'bg-orange-300'
				});
			}
		}
		// greedy lane assignment
		events.sort((a, b) => a.startMin - b.startMin);
		/** @type {number[]} */
		const laneEnds = [];
		const placed = events.map((ev) => {
			let lane = laneEnds.findIndex((end) => end <= ev.startMin);
			if (lane === -1) {
				lane = laneEnds.length;
				laneEnds.push(ev.endMin);
			} else {
				laneEnds[lane] = ev.endMin;
			}
			return { ...ev, lane };
		});
		const laneCount = Math.max(1, laneEnds.length);
		return placed.map((p) => ({ ...p, laneCount }));
	}
</script>

<div class="flex">
	<div>
		<div class="flex text-xs">
			<!-- time axis -->
			<div class="flex flex-col">
				<!-- spacer matching the day header so labels align with the grid bodies -->
				<div class="invisible border-l border-r border-t border-black px-1 leading-tight">
					<div class="font-bold">0</div>
					<div class="text-[10px]">.</div>
				</div>
				<div class="relative w-9 shrink-0" style="height: {calHeight}px">
					{#each calHours as h}
						<div
							class="absolute right-1 -translate-y-1/2 text-[10px] text-gray-500"
							style="top: {calTop(h)}px"
						>
							{Math.floor(h / 60)}:00
						</div>
					{/each}
				</div>
			</div>
			<!-- one column per exam day -->
			{#each semesterConfig.days as day}
				{@const dayEvents = eventsForDay(day, showInvigilations)}
				<div class="flex flex-col">
					<div
						class="border-l border-r border-t border-black px-1 text-center leading-tight {dayEvents.length ===
						0
							? 'bg-base-200'
							: excludedDays.includes(day.number)
								? 'bg-yellow-300'
								: 'bg-green-300'}"
					>
						<div class="text-bold">{mkDateShort(day.date)}</div>
						<!-- <div class="font-[10px] text-gray-700">{day.number}</div> -->
					</div>
					<div
						class="relative w-20 overflow-hidden border border-black {excludedDays.includes(
							day.number
						) && windowsForDay(day).length === 0
							? 'bg-red-200'
							: ''}"
						style="height: {calHeight}px"
					>
						<!-- outside the time windows: rest of the day is excluded (red) -->
						{#each redIntervalsForDay(day) as r}
							<div
								class="absolute inset-x-0 bg-red-200"
								style="top: {calTop(r.startMin)}px; height: {(r.endMin - r.startMin) *
									PX_PER_MIN}px"
								title="außerhalb der Zeitfenster"
							></div>
						{/each}
						<!-- hour gridlines (drawn on top so they stay visible over the red areas) -->
						{#each calHours as h}
							<div
								class="absolute inset-x-0 border-t border-gray-200"
								style="top: {calTop(h)}px"
							></div>
						{/each}
						<!-- available time windows (background band) -->
						{#each windowsForDay(day) as tw}
							<div
								class="absolute inset-x-0 border-y border-dashed border-gray-500 bg-gray-300/20"
								style="top: {calTop(tw.startMin)}px; height: {(tw.endMin - tw.startMin) *
									PX_PER_MIN}px"
								title="Zeitfenster {tw.label}"
							></div>
						{/each}
						<!-- own exams + invigilations (foreground blocks) -->
						{#each dayEvents as ev}
							<div
								class="absolute flex flex-col justify-center overflow-hidden rounded px-0.5 text-center text-[10px] leading-tight {ev.cls}"
								style="top: {calTop(ev.startMin)}px; height: {(ev.endMin - ev.startMin) *
									PX_PER_MIN}px; left: {(ev.lane / ev.laneCount) * 100}%; width: {100 /
									ev.laneCount}%"
								title={ev.title}
							>
								<div class="truncate font-semibold">{ev.label}</div>
								<div class="truncate">{ev.from}–{ev.until}</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<!-- legend -->
		<div class="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
			<span class="flex items-center gap-1"
				><span class="inline-block h-3 w-3 rounded bg-violet-300"></span>Prüfung (Eigenaufsicht)</span
			>
			<span class="flex items-center gap-1"
				><span class="inline-block h-3 w-3 rounded bg-sky-300"></span>Prüfung (fremde Aufsicht)</span
			>
			<span class="flex items-center gap-1"
				><span class="inline-block h-3 w-3 rounded bg-orange-300"></span>Aufsicht</span
			>
			<span class="flex items-center gap-1"
				><span class="inline-block h-3 w-3 rounded bg-yellow-300"></span>Reserve</span
			>
			<span class="flex items-center gap-1"
				><span
					class="inline-block h-3 w-3 rounded border border-dashed border-gray-400 bg-gray-300/30"
				></span>Zeitfenster</span
			>
			<span class="flex items-center gap-1"
				><span class="inline-block h-3 w-3 rounded bg-red-200"></span>ausgeschlossen</span
			>
		</div>
	</div>
</div>
