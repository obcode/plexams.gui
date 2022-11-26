<script>
	export let data;
	import Slot from '$lib/Slot.svelte';
	import SlotExamGroup from '$lib/SlotExamGroup.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';
	import { onMount } from 'svelte';

	let details = false;
	let moveable = false;

	let maxSlots = data.semesterConfig.days.length * data.semesterConfig.starttimes.length;

	// status can be
	// unknown
	// allowed
	// forbidden
	// awkward

	let showGroup = 'all';
	let showAncode = '0';
	let showExamerID = 'all';

	let allProgramsInPlan = [];
	async function getPrograms() {
		const response = await fetch('/api/allProgramsInPlan', {
			method: 'GET'
		});

		allProgramsInPlan = await response.json();
	}
	let allAncodes = [];
	async function getAncodes() {
		const response = await fetch('/api/ancodesInPlan', {
			method: 'GET'
		});

		allAncodes = await response.json();
	}
	let allExamer = [];
	async function getExamer() {
		const response = await fetch('/api/examerInPlan', {
			method: 'GET'
		});

		allExamer = await response.json();
	}

	let slotsStatus = new Map();

	function initSlotsStatus(status) {
		for (let day of data.semesterConfig.days) {
			for (let time of data.semesterConfig.starttimes) {
				slotsStatus[[day.number, time.number]] = status;
			}
		}
	}

	function statusColor(status) {
		if (status == 'unknown' || status == '') {
			return '';
		} else if (status == 'allowed') {
			return 'bg-green-500';
		} else if (status == 'forbidden') {
			return 'bg-red-500';
		} else if (status == 'awkward') {
			return 'bg-yellow-500';
		}
	}

	onMount(() => {
		initSlotsStatus('unknown');
		getPrograms();
		getAncodes();
		getExamer();
	});

	let selectedGroup = -1;
	let conflictingGroupCodes = [];

	async function handleSelect(event) {
		initSlotsStatus('forbidden');
		selectedGroup = event.detail.examGroupCode;
		let allowedSlots = await fetchAllowedSlots(event.detail.examGroupCode);
		for (let slot of allowedSlots) {
			slotsStatus[[slot.dayNumber, slot.slotNumber]] = 'allowed';
		}
		let akwardSlots = await fetchAwkwardSlots(event.detail.examGroupCode);
		for (let slot of akwardSlots) {
			slotsStatus[[slot.dayNumber, slot.slotNumber]] = 'awkward';
		}
		let res = await fetchconflictingGroupCodes(event.detail.examGroupCode);
		conflictingGroupCodes = res.map((conflict) => conflict.examGroupCode);
	}
	async function handleUnselect(event) {
		initSlotsStatus('unknown');
		selectedGroup = -1;
		conflictingGroupCodes = [];
	}

	async function fetchAllowedSlots(examGroupCode) {
		const response = await fetch('/api/allowedSlots', {
			method: 'POST',
			body: JSON.stringify({ examGroupCode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.allowedSlots;
	}

	async function fetchAwkwardSlots(examGroupCode) {
		const response = await fetch('/api/awkwardSlots', {
			method: 'POST',
			body: JSON.stringify({ examGroupCode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.awkwardSlots;
	}

	async function fetchconflictingGroupCodes(examGroupCode) {
		const response = await fetch('/api/conflictingGroupCodes', {
			method: 'POST',
			body: JSON.stringify({ examGroupCode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.conflictingGroupCodes;
	}

	let examGroupsWithoutSlot = data.examGroupsWithoutSlot;

	examGroupsWithoutSlot.sort(
		(g1, g2) => g2.examGroupInfo.studentRegs - g1.examGroupInfo.studentRegs
	);
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Prüfungsplan</div>
</div>

<div class="flex">
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">Details</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					on:click={() => {
						details = !details;
					}}
				/>
			</label>
		</div>
	</div>
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">veränderbar</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					on:click={() => {
						moveable = !moveable;
					}}
				/>
			</label>
		</div>
	</div>
	<div>
		<select class="select select-primary w-full max-w-xs my-2" bind:value={showGroup}>
			<option selected value="all">Alle Gruppen</option>
			{#each allProgramsInPlan as program}
				<option>{program}</option>
			{/each}
		</select>
	</div>
	<div>
		<select class="select select-primary w-full max-w-xs my-2 mx-2" bind:value={showExamerID}>
			<option selected value="all">Alle Prüfer:innen</option>
			{#each allExamer as examer}
				<option value={examer.mainExamerID}>{examer.mainExamer}</option>
			{/each}
		</select>
	</div>
	<div>
		<select class="select select-primary w-full max-w-xs my-2 mx-4" bind:value={showAncode}>
			<option selected value="0">Alle Ancodes</option>
			{#each allAncodes as ancode}
				<option>{ancode}</option>
			{/each}
		</select>
	</div>
</div>
<div>
	<table
		class="table-fixed border-collapse border-solid border-2 border-sky-500 min-w-full max-w-fit"
	>
		<thead class="border-dashed border-2 border-sky-500">
			<tr>
				<th />
				{#each data.semesterConfig.days as day}
					<th class="border-dashed border-2 border-sky-500 object-center">
						<div class="">
							<div>{day.number}</div>
							<div>{mkDateShort(day.date)}</div>
						</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.semesterConfig.starttimes as time}
				<tr>
					<td class="border-dashed border-2 border-sky-500 content-center">
						<div>
							<div>{time.number}</div>
							<div>{time.start}</div>
						</div>
					</td>
					{#each data.semesterConfig.days as day}
						<td
							class="border-dashed border-2 border-sky-500 {statusColor(
								slotsStatus[[day.number, time.number]]
							)}"
						>
							<Slot
								day={day.number}
								time={time.number}
								{maxSlots}
								{selectedGroup}
								{details}
								{moveable}
								{showGroup}
								{showAncode}
								{showExamerID}
								{conflictingGroupCodes}
								on:selected={handleSelect}
								on:unselected={handleUnselect}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if examGroupsWithoutSlot.length > 0}
	<div class="text-center m-2">
		<div class="text-4xl text-center mt-8 uppercase">Noch einzuplanen</div>
	</div>

	<div class="grid  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
		{#each examGroupsWithoutSlot as group}
			<SlotExamGroup
				{group}
				{maxSlots}
				{showGroup}
				{showAncode}
				{showExamerID}
				selected={selectedGroup == group.examGroupCode}
				{details}
				{moveable}
				inSlot={false}
				{conflictingGroupCodes}
				on:selected={handleSelect}
				on:unselected={handleUnselect}
			/>
		{/each}
	</div>
{:else}
	<div class="text-center m-2">
		<div class="text-4xl text-center mt-8 uppercase">💪 Alles geplant</div>
	</div>
{/if}
