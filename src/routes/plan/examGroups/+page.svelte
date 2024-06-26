<script>
	export let data;
	import Slot from '$lib/slot/Slot.svelte';
	import ExamGroupsWithoutSlot from '$lib/examGroups/ExamGroupsWithoutSlot.svelte';
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
	let showOnlyOnline = false;
	let showOnlyExahm = false;
	let showOnlySEB = false;

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

	let refresh = new Map();

	function initRefresh() {
		for (let day of data.semesterConfig.days) {
			for (let time of data.semesterConfig.starttimes) {
				refresh[[day.number, time.number]] = false;
			}
		}
	}

	function statusColor(status) {
		if (status == 'unknown' || status == '') {
			return '';
		} else if (status == 'allowed') {
			return 'bg-green-500';
		} else if (status == 'awkward') {
			return 'bg-yellow-500';
		} else if (status == 'forbidden') {
			return 'bg-red-500';
		}
	}

	let examGroupsWithoutSlot = [];
	async function fetchExamGroupsWithoutSlot() {
		const response = await fetch('/api/examGroupsWithoutSlot', {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		examGroupsWithoutSlot = data.examGroupsWithoutSlot;
		examGroupsWithoutSlot.sort(
			(g1, g2) => g2.examGroupInfo.studentRegs - g1.examGroupInfo.studentRegs
		);
	}

	onMount(() => {
		initSlotsStatus('unknown');
		initRefresh();
		getPrograms();
		getAncodes();
		getExamer();
		fetchExamGroupsWithoutSlot();
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
			if (slotsStatus[[slot.dayNumber, slot.slotNumber]] == 'allowed') {
				slotsStatus[[slot.dayNumber, slot.slotNumber]] = 'awkward';
			}
		}
		let res = await fetchconflictingGroupCodes(event.detail.examGroupCode);
		conflictingGroupCodes = res.map((conflict) => conflict.examGroupCode);
	}

	async function handleUnselect(event) {
		initSlotsStatus('unknown');
		selectedGroup = -1;
		conflictingGroupCodes = [];
	}

	async function handleAddToSlot(event) {
		let success = await addToSlot(event.detail);
		if (success) {
			refresh[[event.detail.slot.dayNumber, event.detail.slot.slotNumber]] = true;
			if (event.detail.oldslot) {
				refresh[[event.detail.oldslot.dayNumber, event.detail.oldslot.slotNumber]] = true;
			} else {
				fetchExamGroupsWithoutSlot();
			}
		}
	}

	async function handleRmFromSlot(event) {
		let success = await rmFromSlot(event.detail);
		if (success) {
			refresh[[event.detail.slot.dayNumber, event.detail.slot.slotNumber]] = true;
			fetchExamGroupsWithoutSlot();
		}
	}

	async function addToSlot(args) {
		const response = await fetch('/api/slot/addToSlot', {
			method: 'POST',
			body: JSON.stringify(args),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.addExamGroupToSlot;
	}

	async function rmFromSlot(args) {
		const response = await fetch('/api/slot/rmFromSlot', {
			method: 'POST',
			body: JSON.stringify(args),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.rmExamGroupFromSlot;
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
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		<b>Deprecated:</b> Prüfungsplan (Prüfungsgruppen)
	</div>
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
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">online</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					on:click={() => {
						showOnlyOnline = !showOnlyOnline;
					}}
				/>
			</label>
		</div>
	</div>
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">EXaHM</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					on:click={() => {
						showOnlyExahm = !showOnlyExahm;
					}}
				/>
			</label>
		</div>
	</div>
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">SafeExamBrowser</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					on:click={() => {
						showOnlySEB = !showOnlySEB;
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
		<thead class="border-dashed border-2 border-sky-500 bg-green-400">
			<tr>
				<th />
				{#each data.semesterConfig.days as day}
					<th class="border-dashed border-2 border-sky-500 object-center">
						<div class="">
							<div>#{day.number}</div>
							<div>{mkDateShort(day.date)}</div>
						</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.semesterConfig.starttimes as time}
				<tr>
					<td class="border-dashed border-2 border-sky-500 content-center bg-green-400">
						<div>
							<div>#{time.number}</div>
							<div>{time.start}</div>
						</div>
					</td>
					{#each data.semesterConfig.days as day}
						<td
							class="align-top border-dashed border-2 border-sky-500 {statusColor(
								slotsStatus[[day.number, time.number]]
							)} "
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
								{showOnlyOnline}
								{showOnlyExahm}
								{showOnlySEB}
								{conflictingGroupCodes}
								refresh={refresh[[day.number, time.number]]}
								on:selected={handleSelect}
								on:unselected={handleUnselect}
								on:addToSlot={handleAddToSlot}
								on:rmFromSlot={handleRmFromSlot}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<ExamGroupsWithoutSlot
	{examGroupsWithoutSlot}
	{maxSlots}
	{showGroup}
	{showAncode}
	{showExamerID}
	{showOnlyOnline}
	{showOnlyExahm}
	{showOnlySEB}
	{selectedGroup}
	{details}
	{moveable}
	{conflictingGroupCodes}
	on:selected={handleSelect}
	on:unselected={handleUnselect}
	on:addToSlot={handleAddToSlot}
/>
