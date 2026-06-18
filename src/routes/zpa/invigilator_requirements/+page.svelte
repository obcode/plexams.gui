<script>
	export let data;
	import { mkDateShort } from '$lib/jshelper/misc';
	import { fade } from 'svelte/transition';

	import InvigilatorTR from '$lib/invigilator/InvigilatorTR.svelte';

	let invigilators = data.todos.invigilators;
	const todos = data.todos;

	let searchTerm = '';
	let filteredInvigilators = [];

	let sortOpen = true;
	let showInvigilations = true;

	let stillOpen = 0;
	let sumTotal = 0;
	let sumDoing = 0;
	for (const invig of data.todos.invigilators) {
		stillOpen += invig.todos.totalMinutes - invig.todos.doingMinutes;
		sumTotal += invig.todos.totalMinutes;
		sumDoing += invig.todos.doingMinutes;
	}

	const stillOpenPerInvig = Math.round(stillOpen / data.todos.invigilators.length);
	const progressPercent = sumTotal > 0 ? Math.round((sumDoing / sumTotal) * 100) : 0;

	// --- Übersichts-Grafiken ---
	const invigCount = invigilators.length;

	// noch offene Minuten je Aufsicht (Abweichung vom Soll)
	const openMinutesList = invigilators.map(
		(/** @type {any} */ i) => i.todos.totalMinutes - i.todos.doingMinutes
	);

	// Erfüllung: „fertig" = keine offenen Minuten mehr (geleistet ≥ zu leisten)
	const doneCount = openMinutesList.filter((/** @type {number} */ o) => o <= 0).length;
	const donePercent = invigCount > 0 ? Math.round((doneCount / invigCount) * 100) : 0;

	// Dot-Plot: ein Punkt pro Aufsicht, an seiner Position auf der „noch offen"-Achse.
	// Punkte mit ähnlichem Wert werden gestapelt, damit man die Dichte sieht.
	const openMin = openMinutesList.length ? Math.min(...openMinutesList) : 0;
	const openMax = openMinutesList.length ? Math.max(...openMinutesList) : 0;
	const openSpan = openMax - openMin || 1;
	const DOT_BINS = 40;
	const DOT_STEP = 8; // px je gestapeltem Punkt
	/** @type {Record<number, number>} */
	const binFill = {};
	const openDots = [...openMinutesList]
		.sort((a, b) => a - b)
		.map((v) => {
			const t = (v - openMin) / openSpan;
			const bin = Math.round(t * (DOT_BINS - 1));
			const stack = binFill[bin] ?? 0;
			binFill[bin] = stack + 1;
			const cls = v <= 0 ? 'bg-success' : v <= 200 ? 'bg-warning' : 'bg-error';
			return { leftPct: t * 100, bottom: stack * DOT_STEP, value: v, cls };
		});
	const maxStack = Math.max(1, ...Object.values(binFill));
	const dotPlotHeight = maxStack * DOT_STEP + 6;
	const zeroPct = openMin < 0 && openMax > 0 ? ((0 - openMin) / openSpan) * 100 : null;

	// Zusammensetzung der angerechneten/geleisteten Zeiten
	const composition = [
		{ label: 'Räume', value: todos.sumExamRooms ?? 0, cls: 'bg-orange-300' },
		{ label: 'Reserve', value: todos.sumReserve ?? 0, cls: 'bg-yellow-300' },
		{ label: 'anrechenbar', value: todos.sumOtherContributions ?? 0, cls: 'bg-info' }
	];
	const compTotal = composition.reduce((s, c) => s + c.value, 0) || 1;

	$: {
		let filteredInvigilatorsTmp = [];
		filteredInvigilators = filteredInvigilatorsTmp;
		if (searchTerm) {
			filteredInvigilatorsTmp = invigilators.filter((invig) =>
				invig.teacher.fullname.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			filteredInvigilatorsTmp = [...invigilators];
		}
		if (sortOpen) {
			filteredInvigilatorsTmp.sort((a, b) => {
				const x = a.todos.totalMinutes - a.todos.doingMinutes;
				const y = b.todos.totalMinutes - b.todos.doingMinutes;
				if (x < y) {
					return 1;
				}
				if (x > y) {
					return -1;
				}
				return 0;
			});
		}
		filteredInvigilators = filteredInvigilatorsTmp;
	}

	let exporting = false;
	let exportProgress = '';

	// Captures every currently shown invigilator card to PNG and bundles them into
	// one ZIP. Respects the active search filter (no search → everyone). The libs
	// are imported dynamically so they stay out of the SSR/main bundle.
	async function exportAllPng() {
		const { toPng } = await import('html-to-image');
		const JSZip = (await import('jszip')).default;
		const cards = /** @type {HTMLElement[]} */ (
			Array.from(document.querySelectorAll('[data-invig-card]'))
		);
		if (!cards.length) return;
		exporting = true;
		try {
			const zip = new JSZip();
			/** @type {Record<string, number>} */
			const used = {};
			// warm-up render — html-to-image's first capture can come out blank
			// before fonts/styles are resolved; throw the result away.
			await toPng(cards[0], { pixelRatio: 1, cacheBust: true });
			for (let i = 0; i < cards.length; i++) {
				exportProgress = `${i + 1} / ${cards.length}`;
				const dataUrl = await toPng(cards[i], {
					pixelRatio: 2,
					backgroundColor: '#ffffff',
					cacheBust: true
				});
				let name = (cards[i].getAttribute('data-invig-name') || `aufsicht_${i + 1}`).replace(
					/[^\w.-]+/g,
					'_'
				);
				if (used[name]) {
					name = `${name}_${used[name]++}`;
				} else {
					used[name] = 1;
				}
				zip.file(`${name}.png`, dataUrl.split(',')[1], { base64: true });
			}
			const blob = await zip.generateAsync({ type: 'blob' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'aufsichten-kalender.zip';
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			exporting = false;
			exportProgress = '';
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex items-center gap-3">
		<h1 class="text-2xl font-semibold">Aufsichten mit Anforderungen</h1>
		<span class="badge badge-primary badge-lg">{invigilators.length}</span>
	</div>

	<div class="rounded-lg border border-base-300 bg-base-100 px-4 py-3">
		<div class="mb-1 flex items-baseline justify-between text-sm">
			<span class="font-medium">Planungsfortschritt</span>
			<span class="tabular-nums text-base-content/60">
				{sumDoing} / {sumTotal} Min.
				<span class="ml-1 font-semibold text-base-content">{progressPercent} %</span>
			</span>
		</div>
		<progress class="progress progress-success h-3 w-full" value={sumDoing} max={sumTotal}
		></progress>
	</div>

	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
		{#each [{ label: 'Aufsichten in Räumen', value: todos.sumExamRooms }, { label: 'Reserve-Aufsichten', value: todos.sumReserve }, { label: 'anrechenbar', value: todos.sumOtherContributions }, { label: 'anrechenbar (bereinigt)', value: todos.sumOtherContributionsOvertimeCutted }, { label: 'zu leisten / Aufsicht', value: todos.todoPerInvigilator }, { label: 'zu leisten / Aufsicht (bereinigt)', value: todos.todoPerInvigilatorOvertimeCutted }, { label: 'Summe noch offen', value: stillOpen, accent: true }, { label: 'noch offen / Aufsicht', value: stillOpenPerInvig, accent: true }] as stat}
			<div
				class="rounded-lg border border-base-300 bg-base-100 px-3 py-2 {stat.accent
					? 'border-warning/40 bg-warning/10'
					: ''}"
			>
				<div class="text-xs leading-tight text-base-content/60">{stat.label}</div>
				<div class="text-lg font-semibold tabular-nums">
					{stat.value}
					<span class="text-xs font-normal text-base-content/50">Min.</span>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-3 md:grid-cols-4">
		<!-- Erfüllung -->
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-base-300 bg-base-100 p-3"
		>
			<div class="mb-2 text-xs font-medium text-base-content/60">fertig (nichts offen)</div>
			<div
				class="radial-progress text-success"
				style="--value:{donePercent}; --size:6rem; --thickness:0.6rem"
				role="progressbar"
			>
				{donePercent} %
			</div>
			<div class="mt-2 text-sm tabular-nums">{doneCount} / {invigCount}</div>
		</div>

		<!-- Verteilung der noch offenen Minuten als Dot-Plot -->
		<div class="rounded-lg border border-base-300 bg-base-100 p-3 md:col-span-2">
			<div class="mb-3 flex items-baseline justify-between">
				<span class="text-xs font-medium text-base-content/60"
					>Verteilung „noch offen" — ein Punkt pro Aufsicht</span
				>
				<span class="text-[10px] text-base-content/50">{invigCount} Aufsichten</span>
			</div>
			<div class="relative" style="height: {dotPlotHeight}px">
				{#if zeroPct !== null}
					<div class="absolute inset-y-0 w-px bg-base-300" style="left: {zeroPct}%"></div>
					<div
						class="absolute -top-3 -translate-x-1/2 text-[9px] text-base-content/50"
						style="left: {zeroPct}%"
					>
						0
					</div>
				{/if}
				{#each openDots as d}
					<div
						class="absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full opacity-80 {d.cls}"
						style="left: {d.leftPct}%; bottom: {d.bottom}px"
						title="{d.value} Min. offen"
					></div>
				{/each}
			</div>
			<div class="mt-1 flex justify-between text-[10px] text-base-content/60">
				<span>min {openMin} Min.</span>
				<span>max {openMax} Min.</span>
			</div>
		</div>

		<!-- Zusammensetzung der Zeiten -->
		<div class="rounded-lg border border-base-300 bg-base-100 p-3">
			<div class="mb-2 text-xs font-medium text-base-content/60">Zusammensetzung der Zeiten</div>
			<div class="flex h-4 w-full overflow-hidden rounded">
				{#each composition as c}
					<div
						class={c.cls}
						style="width: {(c.value / compTotal) * 100}%"
						title="{c.label}: {c.value} Min."
					></div>
				{/each}
			</div>
			<div class="mt-2 flex flex-col gap-1 text-[11px]">
				{#each composition as c}
					<div class="flex items-center justify-between">
						<span class="flex items-center gap-1.5">
							<span class="inline-block h-2 w-2 rounded-full {c.cls}"></span>{c.label}
						</span>
						<span class="tabular-nums">{c.value} Min.</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="flex flex-wrap justify-center gap-1">
		{#each data.semesterConfig.days as day}
			<a class="btn btn-outline btn-sm gap-2" href="/plan/invigilation/{day.number}">
				Tag {day.number}
				<span class="badge badge-warning badge-sm">{mkDateShort(day.date)}</span>
			</a>
		{/each}
	</div>
</div>

<div
	class="sticky top-0 z-10 mx-2 mt-2 flex items-center gap-3 border-b border-base-300 bg-base-100/95 py-2 backdrop-blur"
>
	<input
		class="input input-bordered input-sm flex-1"
		type="text"
		bind:value={searchTerm}
		placeholder="Suche Aufsichten"
	/>
	<label class="label cursor-pointer gap-2">
		<span class="label-text">Nur Prüfungen</span>
		<input
			type="checkbox"
			class="toggle toggle-sm"
			checked={!showInvigilations}
			on:change={(e) => (showInvigilations = !e.currentTarget.checked)}
		/>
	</label>
	<label class="label cursor-pointer gap-2">
		<span class="label-text">Alphabetisch</span>
		<input
			type="checkbox"
			class="toggle toggle-sm"
			on:click={() => {
				sortOpen = !sortOpen;
			}}
		/>
	</label>
	<button class="btn btn-outline btn-sm gap-2" on:click={exportAllPng} disabled={exporting}>
		{#if exporting}
			<span class="loading loading-spinner loading-xs"></span>
			{exportProgress}
		{:else}
			📷 Kalender als PNG (ZIP)
		{/if}
	</button>
</div>

{#key filteredInvigilators}
	<div class="mx-2 flex flex-col items-center" transition:fade>
		{#each filteredInvigilators as invigilator, index}
			<InvigilatorTR
				semesterConfig={data.semesterConfig}
				{index}
				{invigilator}
				{showInvigilations}
				base100={todos.todoPerInvigilatorOvertimeCutted}
			/>
		{/each}
	</div>
{/key}
