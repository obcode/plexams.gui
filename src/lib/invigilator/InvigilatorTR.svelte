<script>
	export let semesterConfig;
	export let index;
	export let invigilator;
	// shared scale across all rows so the progress bars are comparable
	export let maxMinutes = 0;
	// forwarded to the calendar: hide Aufsicht/Reserve blocks, show only exams
	export let showInvigilations = true;

	import InvigilatorDays from './InvigilatorDays.svelte';

	function nameBg(invigilator) {
		if (!invigilator.requirements.fromZpa) {
			return 'bg-red-400';
		}
		if (invigilator.todos.enough) {
			return 'bg-green-400';
		}
		return 'bg-base-200';
	}

	let contribution = 0;
	if (invigilator.requirements) {
		contribution = invigilator.requirements.allContributions;
	}

	let openMinutes = 0;
	$: openMinutes = invigilator.todos.totalMinutes - invigilator.todos.doingMinutes;

	function openColor() {
		if (openMinutes <= 0) {
			return 'progress-success';
		}
		if (openMinutes < 60) {
			return 'progress-warning';
		}
		return 'progress-error';
	}
</script>

<div
	class="flex items-stretch gap-3 border-b border-base-300 bg-base-100 py-2"
	data-invig-card
	data-invig-name={invigilator.teacher.id}
>
	<!-- left: textual info + progress bars -->
	<div class="w-72 shrink-0 text-sm">
		<div class="rounded px-2 py-1 font-bold {nameBg(invigilator)}">
			{invigilator.teacher.shortname} ({invigilator.teacher.id})
		</div>

		{#if invigilator.requirements}
			{#if invigilator.requirements.factor != 1}
				<div class="px-2 py-1 text-xs text-gray-600">
					Faktor {invigilator.requirements.factor}
					{#if invigilator.requirements.partTime != 1}· Teilzeit {invigilator.requirements
							.partTime}{/if}
					{#if invigilator.requirements.freeSemester != 0}· Freisemester {invigilator.requirements
							.freeSemester}{/if}
					{#if invigilator.requirements.overtimeLastSemester != 0}· letztes Semester {invigilator
							.requirements.overtimeLastSemester}{/if}
					{#if invigilator.requirements.overtimeThisSemester != 0}· dieses Semester {invigilator
							.requirements.overtimeThisSemester}{/if}
				</div>
			{/if}

			<div class="mt-1 flex flex-col gap-1 px-2 text-xs">
				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">anrechenbar</span>
					<progress
						class="progress progress-info flex-1"
						value={contribution > 0 ? contribution : 0}
						max={maxMinutes}
					></progress>
					<span class="w-12 shrink-0 text-right tabular-nums"
						>{contribution > 0 ? contribution : ''}</span
					>
				</div>

				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">zu leisten</span>
					<progress
						class="progress progress-neutral flex-1"
						value={invigilator.todos.totalMinutes}
						max={maxMinutes}
					></progress>
					<span class="w-12 shrink-0 text-right tabular-nums">{invigilator.todos.totalMinutes}</span
					>
				</div>

				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">geleistet</span>
					<progress
						class="progress progress-success flex-1"
						value={invigilator.todos.doingMinutes}
						max={maxMinutes}
					></progress>
					<span class="w-12 shrink-0 text-right tabular-nums"
						>{invigilator.todos.doingMinutes > 0 ? invigilator.todos.doingMinutes : ''}</span
					>
				</div>

				<div class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-right text-gray-600">noch offen</span>
					<progress
						class="progress {openColor()} flex-1"
						value={openMinutes > 0 ? openMinutes : 0}
						max={maxMinutes}
					></progress>
					<span class="w-12 shrink-0 text-right font-semibold tabular-nums">{openMinutes}</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- right: calendar -->
	<div class="overflow-x-auto">
		<InvigilatorDays {semesterConfig} {invigilator} {showInvigilations} />
	</div>
</div>
