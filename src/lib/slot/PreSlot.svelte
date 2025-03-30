<script>
	export let day;
	export let time;
	export let maxSlots;
	export let selectedExam;
	export let selectedExamerID;
	export let onlyPlannedByMe;
	export let onlyConflicts;
	export let details;
	export let moveable;
	export let showExam;
	export let showAncode;
	export let showExamerID;
	export let showOnlyOnline;
	export let showOnlyExahm;
	export let showOnlySEB;
	export let showOnlyEXaHMRooms;
	import { onMount } from 'svelte';
	import { mkDateShort } from '$lib/jshelper/misc';

	import PreSlotExam from '$lib/examsInPlan/PreSlotExam.svelte';

	let exams = [];

	async function fetchExams() {
		const response = await fetch('/api/preExamsInSlot', {
			method: 'POST',
			body: JSON.stringify({ day: day.number, time: time.number }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		exams = data.examsInSlot;
	}

	let exahm = [];

	async function fetchEXaHMRooms() {
		const response = await fetch('/api/plan/roomsForSlot', {
			method: 'POST',
			body: JSON.stringify({ day: day.number, time: time.number }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		exahm = data.roomsForSlot.exahmRooms;
	}

	let conflicts = 0;

	onMount(() => {
		fetchExams();
		fetchEXaHMRooms();
	});
</script>

<div class="flex justify-between">
	<div class="badge gap-2 m-1">{mkDateShort(day.date)}, {time.start}</div>
	{#if exams.length > 0}
		{#if conflicts > 0}
			<div class="alert shadow-lg p-1 w-full">
				<div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current flex-shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/></svg
					>
					<span>{conflicts} Konflikte</span>
				</div>
			</div>
		{/if}
		<div class="flex justify-end">
			{#if count > 0}
				<div class="badge {badgeColor(count)} gap-2 m-1">{count}</div>
			{/if}
		</div>
	{/if}
</div>
{#if showOnlyEXaHMRooms}
	<div>
		{#each exahm as room}
			<div class="badge badge-warning">{room.name}</div>
		{/each}
	</div>
{/if}

{#each exams as exam}
	<PreSlotExam
		{exam}
		{maxSlots}
		{showExam}
		{showAncode}
		{showExamerID}
		{showOnlyOnline}
		{showOnlyExahm}
		{showOnlySEB}
		{selectedExam}
		{selectedExamerID}
		{onlyPlannedByMe}
		{onlyConflicts}
		{details}
		{moveable}
		inSlot={true}
		{conflictingAncodes}
	/>
{/each}
