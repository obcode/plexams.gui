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
		exams = data.preExamsInSlot;
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
		exahm = data.roomsForSlot.rooms.filter((room) => room.exahm);
	}

	let conflicts = 0;

	onMount(() => {
		fetchExams();
		fetchEXaHMRooms();
	});
</script>

<div class="flex justify-between">
	<div class="badge gap-2 m-1">{mkDateShort(day.date)}, {time.start}</div>
	{#if exams && exams.length > 0}
		{#if conflicts > 0}
			<div class="alert shadow-lg p-1 w-full">
				<div>
					<span class="text-xl">⚠️</span>
					<span>{conflicts} Konflikte</span>
				</div>
			</div>
		{/if}
	{/if}
</div>
{#if showOnlyEXaHMRooms}
	<div>
		{#each exahm as room}
			<div class="badge badge-warning">{room.name}</div>
		{/each}
	</div>
{/if}

{#if exams}
	{#each exams as exam}
		<PreSlotExam {exam} />
	{/each}
{/if}
