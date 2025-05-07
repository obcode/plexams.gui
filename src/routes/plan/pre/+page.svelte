<script>
	export let data;
	import PreSlot from '$lib/slot/PreSlot.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';
	import { onMount } from 'svelte';

	let onlyPlannedByMe = false;
	let details = false;
	let moveable = false;

	let maxSlots = data.semesterConfig.days.length * data.semesterConfig.starttimes.length;

	// // status can be
	// // unknown
	// // allowed
	// // forbidden
	// // awkward

	let onlyConflicts = true;

	let showExam = 'all';
	let showAncode = '0';
	let showExamerID = 'all';
	let showOnlyOnline = false;
	let showOnlyExahm = false;
	let showOnlySEB = false;
	let showOnlyEXaHMRooms = true;
	let showMucdaiSlots = true;

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
			return 'bg-green-200';
		} else if (status == 'awkward') {
			return 'bg-yellow-500';
		} else if (status == 'forbidden') {
			return 'bg-red-500';
		}
	}

	let mucdaiSlot = new Map();

	for (const slot of data.semesterConfig.goSlots) {
		mucdaiSlot[[slot.dayNumber, slot.slotNumber]] = 'border border-red-500 border-8 ';
	}

	let mucdaiSlotToShow = new Map();

	function handleMucdaiSlots() {
		if (showMucdaiSlots) {
			mucdaiSlotToShow = mucdaiSlot;
		} else {
			mucdaiSlotToShow = new Map();
		}
	}

	// let examGroupsWithoutSlot = [];
	// async function fetchExamGroupsWithoutSlot() {
	// 	const response = await fetch('/api/examGroupsWithoutSlot', {
	// 		method: 'GET',
	// 		headers: {
	// 			'content-type': 'application/json'
	// 		}
	// 	});
	// 	let data = await response.json();
	// 	examGroupsWithoutSlot = data.examGroupsWithoutSlot;
	// 	examGroupsWithoutSlot.sort(
	// 		(g1, g2) => g2.examGroupInfo.studentRegs - g1.examGroupInfo.studentRegs
	// 	);
	// }

	onMount(() => {
		// 	initSlotsStatus('unknown');
		// 	initRefresh();
		getPrograms();
		getAncodes();
		getExamer();
		handleMucdaiSlots();
		// 	fetchExamGroupsWithoutSlot();
	});

	let selectedExam = -1;
	let conflictingAncodes = [];
	let selectedExamerID = -1;

	async function handleSelect(event) {
		initSlotsStatus('forbidden');
		selectedExam = event.detail.ancode;
		selectedExamerID = event.detail.mainExamerID;
		let allowedSlots = await fetchAllowedSlots(event.detail.ancode);
		for (let slot of allowedSlots) {
			slotsStatus[[slot.dayNumber, slot.slotNumber]] = 'allowed';
		}
		let akwardSlots = await fetchAwkwardSlots(event.detail.ancode);
		for (let slot of akwardSlots) {
			if (slotsStatus[[slot.dayNumber, slot.slotNumber]] == 'allowed') {
				slotsStatus[[slot.dayNumber, slot.slotNumber]] = 'awkward';
			}
		}
		let res = await fetchconflictingAncodes(event.detail.ancode);
		conflictingAncodes = res.map((conflict) => conflict.ancode);
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Vorab-Planung (ohne Primuss-Daten)</div>
</div>

<div class="flex">
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">Nur eigene Planung</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					on:click={() => {
						onlyPlannedByMe = !onlyPlannedByMe;
					}}
				/>
			</label>
		</div>
	</div>
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">Nur Konflikte</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					checked
					on:click={() => {
						onlyConflicts = !onlyConflicts;
					}}
				/>
			</label>
		</div>
	</div>
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
				<span class="label-text">EXaHM/SEB</span>
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
		<select class="select select-primary w-full max-w-xs my-2" bind:value={showExam}>
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
	<div>
		<div class="form-control my-3 ml-10">
			<label class="label cursor-pointer">
				<span class="label-text">EXaHM-Räume</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					checked
					on:click={() => {
						showOnlyEXaHMRooms = !showOnlyEXaHMRooms;
					}}
				/>
			</label>
		</div>
	</div>
	<div>
		<div class="form-control my-3">
			<label class="label cursor-pointer">
				<span class="label-text">MUC.DAI-Slots</span>
				<input
					type="checkbox"
					class="toggle mx-3"
					checked
					on:click={() => {
						showMucdaiSlots = !showMucdaiSlots;
						handleMucdaiSlots();
					}}
				/>
			</label>
		</div>
	</div>
</div>
<div>
	<table
		class="table-fixed border-collapse border-solid border-2 border-sky-500 min-w-full max-w-none"
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
							)}"
						>
							<div class={mucdaiSlotToShow[[day.number, time.number]]}>
								<PreSlot
									{day}
									{time}
									{maxSlots}
									{selectedExam}
									{selectedExamerID}
									{onlyPlannedByMe}
									{onlyConflicts}
									{details}
									{moveable}
									{showExam}
									{showAncode}
									{showExamerID}
									{showOnlyOnline}
									{showOnlyExahm}
									{showOnlySEB}
									{showOnlyEXaHMRooms}
								/>
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
