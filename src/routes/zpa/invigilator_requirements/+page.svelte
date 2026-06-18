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
