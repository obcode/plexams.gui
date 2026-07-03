<script>
	import { fade } from 'svelte/transition';

	import InvigilatorTR from '$lib/invigilator/InvigilatorTR.svelte';
	import NoSemesterConfig from '$lib/config/NoSemesterConfig.svelte';
	let { data } = $props();

	let invigilators = data.todos.invigilators;
	const todos = data.todos;

	let searchTerm = $state('');

	let sortOpen = $state(true);
	let showInvigilations = $state(true);

	let stillOpen = 0;
	for (const invig of data.todos.invigilators) {
		stillOpen += invig.todos.totalMinutes - invig.todos.doingMinutes;
	}

	const stillOpenPerInvig = Math.round(stillOpen / data.todos.invigilators.length);

	// --- Übersichts-Grafiken ---
	const invigCount = invigilators.length;
	const DOT_BINS = 40;
	const DOT_STEP = 8; // px je gestapeltem Punkt

	// „noch offen" je Aufsicht (Abweichung vom Soll). Jeder Punkt trägt die Teacher-ID,
	// und je Spalte (Bin) merken wir uns alle IDs, damit ein Klick danach filtern kann.
	const openItems = invigilators.map((/** @type {any} */ i) => ({
		id: i.teacher.id,
		value: i.todos.totalMinutes - i.todos.doingMinutes
	}));
	const openVals = openItems.map((/** @type {any} */ o) => o.value);
	const openMin = openVals.length ? Math.min(...openVals) : 0;
	const openMax = openVals.length ? Math.max(...openVals) : 0;
	const openSpan = openMax - openMin || 1;
	/** @type {Record<number, number>} */
	const openBinFill = {};
	/** @type {Record<number, number[]>} */
	const openBinIds = {};
	const openDots = [...openItems]
		.sort((a, b) => a.value - b.value)
		.map((o) => {
			const bin = Math.round(((o.value - openMin) / openSpan) * (DOT_BINS - 1));
			const stack = openBinFill[bin] ?? 0;
			openBinFill[bin] = stack + 1;
			if (!openBinIds[bin]) openBinIds[bin] = [];
			openBinIds[bin].push(o.id);
			const cls = o.value <= 0 ? 'bg-success' : o.value <= 200 ? 'bg-warning' : 'bg-error';
			return {
				leftPct: (bin / (DOT_BINS - 1)) * 100,
				bottom: stack * DOT_STEP,
				value: o.value,
				cls,
				bin
			};
		});
	const dotPlotHeight = Math.max(1, ...Object.values(openBinFill)) * DOT_STEP + 6;
	const zeroBin = Math.round(((0 - openMin) / openSpan) * (DOT_BINS - 1));
	const zeroPct = openMin < 0 && openMax > 0 ? (zeroBin / (DOT_BINS - 1)) * 100 : null;

	// Verhältnis Räume/Reserve je Aufsicht (Eigenaufsicht ausgenommen). 0 % = nur Räume.
	const RESERVE_MIN = 60;
	/** @type {{ id: number, share: number, room: number, reserve: number }[]} */
	const ratioItems = [];
	for (const i of invigilators) {
		let room = 0;
		let reserve = 0;
		for (const inv of i.todos?.invigilations ?? []) {
			if (inv.isSelfInvigilation) continue;
			if (inv.isReserve) reserve += RESERVE_MIN;
			else room += inv.duration ?? 0;
		}
		if (room + reserve > 0)
			ratioItems.push({ id: i.teacher.id, share: reserve / (room + reserve), room, reserve });
	}
	/** @type {Record<number, number>} */
	const ratioBinFill = {};
	/** @type {Record<number, number[]>} */
	const ratioBinIds = {};
	const ratioDots = [...ratioItems]
		.sort((a, b) => a.share - b.share)
		.map((rv) => {
			const bin = Math.round(rv.share * (DOT_BINS - 1));
			const stack = ratioBinFill[bin] ?? 0;
			ratioBinFill[bin] = stack + 1;
			if (!ratioBinIds[bin]) ratioBinIds[bin] = [];
			ratioBinIds[bin].push(rv.id);
			return {
				leftPct: (bin / (DOT_BINS - 1)) * 100,
				bottom: stack * DOT_STEP,
				room: rv.room,
				reserve: rv.reserve,
				share: rv.share,
				bin
			};
		});
	const ratioPlotHeight = Math.max(1, ...Object.values(ratioBinFill)) * DOT_STEP + 6;
	const ratioCount = ratioItems.length;
	const ratioWithoutCount = invigCount - ratioCount;

	// Dot-Filter: Klick auf einen Punkt filtert die Liste auf alle Aufsichten in
	// derselben Spalte (gleicher Wert/Bin).
	/** @type {{ kind: string, bin: number, ids: Set<number>, label: string } | null} */
	let dotFilter = $state(null);
	/**
	 * @param {string} kind
	 * @param {number} bin
	 * @param {string} label
	 */
	function pickDot(kind, bin, label) {
		if (dotFilter && dotFilter.kind === kind && dotFilter.bin === bin) {
			dotFilter = null;
			return;
		}
		const ids = (kind === 'open' ? openBinIds[bin] : ratioBinIds[bin]) ?? [];
		dotFilter = { kind, bin, ids: new Set(ids), label };
	}
	function clearDotFilter() {
		dotFilter = null;
	}

	const filteredInvigilators = $derived.by(() => {
		/** @type {any[]} */
		let tmp;
		if (searchTerm) {
			const term = searchTerm.trim().toLowerCase();
			// nach Name, Kürzel oder Aufsichts-Nummer (teacher.id) suchen
			tmp = invigilators.filter(
				(/** @type {any} */ invig) =>
					invig.teacher.fullname.toLowerCase().includes(term) ||
					(invig.teacher.shortname ?? '').toLowerCase().includes(term) ||
					String(invig.teacher.id).includes(term)
			);
		} else {
			tmp = [...invigilators];
		}
		if (dotFilter) {
			const ids = dotFilter.ids;
			tmp = tmp.filter((/** @type {any} */ invig) => ids.has(invig.teacher.id));
		}
		if (sortOpen) {
			tmp.sort((/** @type {any} */ a, /** @type {any} */ b) => {
				const x = a.todos.totalMinutes - a.todos.doingMinutes;
				const y = b.todos.totalMinutes - b.todos.doingMinutes;
				if (x < y) return 1;
				if (x > y) return -1;
				return 0;
			});
		}
		return tmp;
	});

	let exporting = $state(false);
	let exportProgress = $state('');

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

	let uploading = $state(false);
	let uploadProgress = $state('');
	/** @type {{ done: number, failed: string[], blocked: boolean } | null} */
	let uploadResult = $state(null);

	// Captures every currently shown invigilator card to PNG and uploads each one
	// directly to the backend attachment store (kind invigilation-image, key =
	// Aufsichts-/Lehrer-ID). Respects the active search filter. No ZIP needed —
	// the images are sent straight to the server.
	async function uploadAllPng() {
		const { toBlob } = await import('html-to-image');
		const { uploadAttachment } = await import('$lib/email/attachments');
		const cards = /** @type {HTMLElement[]} */ (
			Array.from(document.querySelectorAll('[data-invig-card]'))
		);
		if (!cards.length) return;
		uploading = true;
		uploadResult = null;
		let done = 0;
		/** @type {string[]} */
		const failed = [];
		let blocked = false;
		try {
			// warm-up render — html-to-image's first capture can come out blank.
			await toBlob(cards[0], { pixelRatio: 1, cacheBust: true });
			for (let i = 0; i < cards.length; i++) {
				uploadProgress = `${i + 1} / ${cards.length}`;
				const id = cards[i].getAttribute('data-invig-name') || `aufsicht_${i + 1}`;
				const blob = await toBlob(cards[i], {
					pixelRatio: 2,
					backgroundColor: '#ffffff',
					cacheBust: true
				});
				if (!blob) {
					failed.push(id);
					continue;
				}
				const res = await uploadAttachment({
					kind: 'invigilation-image',
					key: id,
					blob,
					filename: `invig-${id}.png`
				});
				// 409: Validierung/Transfer/Mail läuft → abbrechen, nur Hinweis.
				if (res.blocked) {
					blocked = true;
					break;
				}
				if (!res.ok) {
					failed.push(id);
					continue;
				}
				done++;
			}
		} finally {
			uploading = false;
			uploadProgress = '';
			uploadResult = { done, failed, blocked };
		}
	}
</script>

{#if !data.semesterConfig}
	<NoSemesterConfig />
{:else}
	<div class="mx-2 mt-4 flex flex-col gap-4">
		<div class="flex items-center gap-3">
			<h1 class="text-2xl font-semibold">Aufsichten mit Anforderungen</h1>
			<span class="badge badge-primary badge-lg">{invigilators.length}</span>
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

		<div class="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_2fr_1fr]">
			<!-- Verhältnis Räume/Reserve als Dot-Plot -->
			<div class="rounded-lg border border-base-300 bg-base-100 p-3">
				<div class="mb-3 flex items-baseline justify-between">
					<span class="text-xs font-medium text-base-content/60"
						>Verhältnis Räume / Reserve — ein Punkt pro Aufsicht</span
					>
					<span class="text-[10px] text-base-content/50"
						>{ratioCount} mit Aufsichten · {ratioWithoutCount} ohne Aufsichten</span
					>
				</div>
				<div class="relative" style="height: {ratioPlotHeight}px">
					<!-- 50/50-Linie -->
					<div class="absolute inset-y-0 left-1/2 w-px bg-base-300"></div>
					{#each ratioDots as d}
						<button
							class="absolute h-2 w-2 -translate-x-1/2 rounded-full bg-primary transition-transform hover:scale-150 {dotFilter &&
							dotFilter.kind === 'ratio' &&
							dotFilter.bin === d.bin
								? 'opacity-100 ring-2 ring-primary'
								: 'opacity-80'}"
							style="left: {d.leftPct}%; bottom: {d.bottom}px"
							title="Räume {d.room} Min · Reserve {d.reserve} Min — klicken zum Filtern"
							aria-label="Aufsichten mit {Math.round(d.share * 100)} % Reserve filtern"
							onclick={() => pickDot('ratio', d.bin, `${Math.round(d.share * 100)} % Reserve`)}
						></button>
					{/each}
				</div>
				<div class="mt-1 flex justify-between text-[10px] text-base-content/60">
					<span>nur Räume</span>
					<span>50 / 50</span>
					<span>nur Reserve</span>
				</div>
			</div>

			<!-- Verteilung der noch offenen Minuten als Dot-Plot -->
			<div class="rounded-lg border border-base-300 bg-base-100 p-3">
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
						<button
							class="absolute h-2 w-2 -translate-x-1/2 rounded-full transition-transform hover:scale-150 {d.cls} {dotFilter &&
							dotFilter.kind === 'open' &&
							dotFilter.bin === d.bin
								? 'opacity-100 ring-2 ring-primary'
								: 'opacity-80'}"
							style="left: {d.leftPct}%; bottom: {d.bottom}px"
							title="{d.value} Min. offen — klicken zum Filtern"
							aria-label="Aufsichten mit {d.value} Min. offen filtern"
							onclick={() => pickDot('open', d.bin, `${d.value} Min. offen`)}
						></button>
					{/each}
				</div>
				<div class="mt-1 flex justify-between text-[10px] text-base-content/60">
					<span>min {openMin} Min.</span>
					<span>max {openMax} Min.</span>
				</div>
			</div>

			<!-- Manuell ausgeschlossene Aufsichten (Aufsichts-Constraints) -->
			<div class="rounded-lg border border-warning/40 bg-warning/5 p-3">
				<div class="mb-3 flex items-baseline justify-between">
					<span class="text-xs font-medium text-base-content/60"> Manuell ausgeschlossen </span>
					<span class="text-[10px] text-base-content/50"
						>{data.excludedByConfig.length} Person(en)</span
					>
				</div>
				{#if data.excludedByConfig.length}
					<div class="flex flex-col gap-1">
						{#each data.excludedByConfig as ex}
							<span
								class="badge badge-outline badge-warning badge-sm w-full justify-start truncate"
								title="ID {ex.teacher.id} · Faktor {ex.requirements?.factor}"
							>
								{ex.teacher.fullname}
							</span>
						{/each}
					</div>
					<div class="mt-2 text-[10px] text-base-content/50">
						Würden Aufsicht machen (Faktor &gt; 0), sind aber per Konfiguration ausgenommen —
						prüfen, ob die Liste noch aktuell ist.
					</div>
				{:else}
					<div class="text-sm text-base-content/50">Niemand manuell ausgeschlossen.</div>
				{/if}
			</div>
		</div>
	</div>

	<div
		class="sticky top-0 z-10 mx-2 mt-2 flex items-center gap-3 border-b border-base-300 bg-base-100/95 py-2 backdrop-blur"
	>
		<input
			class="input input-bordered input-sm flex-1"
			type="text"
			bind:value={searchTerm}
			placeholder="Suche Aufsichten (Name, Kürzel oder Nummer)"
		/>
		{#if dotFilter}
			<span class="badge badge-primary gap-2 whitespace-nowrap">
				{dotFilter.label} ({dotFilter.ids.size})
				<button class="font-bold" onclick={clearDotFilter} aria-label="Filter aufheben">✕</button>
			</span>
		{/if}
		<label class="label cursor-pointer gap-2">
			<span class="label-text">Nur Prüfungen</span>
			<input
				type="checkbox"
				class="toggle toggle-sm"
				checked={!showInvigilations}
				onchange={(e) => (showInvigilations = !e.currentTarget.checked)}
			/>
		</label>
		<label class="label cursor-pointer gap-2">
			<span class="label-text">Alphabetisch</span>
			<input
				type="checkbox"
				class="toggle toggle-sm"
				onclick={() => {
					sortOpen = !sortOpen;
				}}
			/>
		</label>
		<button class="btn btn-outline btn-sm gap-2" onclick={exportAllPng} disabled={exporting}>
			{#if exporting}
				<span class="loading loading-spinner loading-xs"></span>
				{exportProgress}
			{:else}
				📷 Kalender als PNG (ZIP)
			{/if}
		</button>
		<button
			class="btn btn-primary btn-sm gap-2"
			onclick={uploadAllPng}
			disabled={uploading || exporting}
		>
			{#if uploading}
				<span class="loading loading-spinner loading-xs"></span>
				{uploadProgress}
			{:else}
				⬆ Kalender auf Server hochladen
			{/if}
		</button>
	</div>

	{#if uploadResult}
		<div
			class="mx-2 alert py-2 text-sm {uploadResult.blocked || uploadResult.failed.length
				? 'alert-warning'
				: 'alert-success'}"
			transition:fade
		>
			<div>
				<div>{uploadResult.done} Bild(er) hochgeladen.</div>
				{#if uploadResult.blocked}
					<div class="mt-1 text-xs">
						Abgebrochen: Es läuft gerade eine Validierung oder ein anderer Transfer/E-Mail-Versand.
						Bitte später erneut hochladen.
					</div>
				{/if}
				{#if uploadResult.failed.length}
					<div class="mt-1 text-xs">
						Fehlgeschlagen ({uploadResult.failed.length}):
						<span class="font-mono">{uploadResult.failed.join(', ')}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

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
{/if}
