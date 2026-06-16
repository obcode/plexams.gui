<script>
	export let semesterConfig;
	export let invigilator;
	import { mkDateShort } from '$lib/jshelper/misc';
	import Invigilation from './Invigilation.svelte';
	const requirements = invigilator.requirements;

	const onlyInSlots = requirements?.onlyInSlots ?? [];
	const hasOnlyInSlots = onlyInSlots.length > 0;
	const onlyInSlotsSet = new Set(
		onlyInSlots.map(
			(/** @type {{ dayNumber: number, slotNumber: number }} */ s) =>
				`${s.dayNumber}-${s.slotNumber}`
		)
	);
	/**
	 * @param {number} dayNumber
	 * @param {number} slotNumber
	 */
	function inOnlyInSlots(dayNumber, slotNumber) {
		return onlyInSlotsSet.has(`${dayNumber}-${slotNumber}`);
	}

	let small = true;

	const invigilations = invigilator.todos.invigilations.sort(function (i1, i2) {
		const day = i1.slot.dayNumber - i2.slot.dayNumber;
		if (day != 0) {
			return day;
		}
		return i1.slot.slotNumber - i2.slot.slotNumber;
	});

	function bg(day) {
		if (!requirements) {
			return 'bg-gray-100';
		}
		if (requirements.examDays.includes(day) && requirements.excludedDays.includes(day)) {
			return 'bg-yellow-500';
		}
		if (requirements.excludedDays.includes(day)) {
			return 'bg-red-500';
		}
		if (requirements.examDays.includes(day)) {
			return 'bg-green-500';
		}
	}
	function bgInvigilation(day) {
		if (invigilator.todos.invigilationDays.includes(day)) {
			return 'bg-cyan-500';
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="flex" on:click={() => (small = !small)} on:keypress={() => small}>
	{#if small}
		<div class="text-center">
			<div class="flex">
				{#each semesterConfig.days as day}
					<div class="border border-black p-1 {bg(day.number)}">
						{day.number}
					</div>
				{/each}
			</div>
			{#if invigilator.todos.invigilationDays.length > 0}
				<div class="flex">
					{#each semesterConfig.days as day}
						<div class="border border-black p-1 {bgInvigilation(day.number)}">
							{day.number}
						</div>
					{/each}
				</div>
			{/if}
			{#if hasOnlyInSlots}
				<div class=" text-center">
					<div class="mb-1 text-xs font-bold">📌 nur in Slots</div>
					<table class="border-collapse text-xs">
						<thead>
							<tr>
								{#each semesterConfig.days as day}
									<th class="border border-black px-1">{day.number}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each semesterConfig.starttimes as time}
								<tr>
									{#each semesterConfig.days as day}
										<td
											class="border border-black px-1 {inOnlyInSlots(day.number, time.number)
												? 'bg-purple-500 text-white'
												: ''}"
										>
											{inOnlyInSlots(day.number, time.number) ? '✓' : ''}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{:else}
		<div class="text-center">
			<div class="flex">
				{#each semesterConfig.days as day}
					<div class="w-20 border border-black p-1">
						{mkDateShort(day.date)}
					</div>
				{/each}
			</div>
			<div class="flex">
				{#each semesterConfig.days as day}
					<div class="w-20 border border-black p-1 {bg(day.number)}">
						{day.number}
					</div>
				{/each}
			</div>
			{#if invigilator.todos.invigilationDays.length > 0}
				<div class="flex">
					{#each semesterConfig.days as day}
						<div class="w-20 border border-black p-1 {bgInvigilation(day.number)}">
							{day.number}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if invigilator.todos.invigilations.length > 0}
		<div class="ml-7">
			<ol class="list-decimal">
				{#each invigilations as invigilation}
					<li class="mb-1 rounded">
						<Invigilation {invigilation} />
					</li>
				{/each}
			</ol>
		</div>
	{/if}
	{#if invigilator.todos.invigilationDays.length > 3}
		<div class="badge bagde-error bg-red-500">
			{invigilator.todos.invigilationDays.length} Tage!
		</div>
	{/if}
</div>
