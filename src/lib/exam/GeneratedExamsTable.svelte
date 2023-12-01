<script>
	export let exams;

	import { goto } from '$app/navigation';
	import ConstraintsTable from '$lib/ConstraintsTable.svelte';
	import { bgEvent } from '@event-calendar/core';
	import { mkStarttime } from '$lib/jshelper/misc.js';

	let searchTermAncode = '';
	let searchTermTeachers = '';
	let searchTermModule = '';
	let searchTermGroups = '';
	let filteredExams = [];

	$: {
		if (searchTermAncode) {
			filteredExams = exams.filter((exam) => exam.ancode.toString().startsWith(searchTermAncode));
		} else if (searchTermTeachers) {
			filteredExams = exams.filter((exam) =>
				exam.zpaExam.mainExamer.toLowerCase().includes(searchTermTeachers.toLowerCase())
			);
		} else if (searchTermModule) {
			filteredExams = exams.filter((exam) =>
				exam.zpaExam.module.toLowerCase().includes(searchTermModule.toLowerCase())
			);
		} else if (searchTermGroups) {
			filteredExams = exams.filter((exam) => {
				for (let primussExam of exam.primussExams) {
					if (primussExam.exam.program.toLowerCase().startsWith(searchTermGroups.toLowerCase())) {
						return true;
					}
				}
				return false;
			});
		} else {
			filteredExams = [...exams];
		}
	}

	function gotoo(ancode) {
		goto(`/exam/generatedExams/${ancode}`);
	}

	function regs(exam) {
		let sum = 0;
		for (const reg of exam.primussExams) {
			sum += reg.studentRegs.length;
		}

		return sum;
	}

	// function regsP(exam) {
	// 	let programs = '';
	// 	for (const reg of exam.studentRegs) {
	// 		programs = ``;
	// 	}

	// 	return programs;
	// }

	function bg(exam) {
		if (exam.constraints && exam.constraints.notPlannedByMe) {
			return 'bg-slate-300';
		}
		if (regs(exam) == 0) {
			return 'bg-red-300';
		}
		return '';
	}
</script>

<div class="flex">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermAncode}
		placeholder="AnCode"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermModule}
		placeholder="Modulname"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermTeachers}
		placeholder="Dozierender"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermGroups}
		placeholder="Gruppe"
	/>
</div>

<div class="overflow-x-auto my-2">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th>Termin</th>
				<th>AnCode</th>
				<th>Modul</th>
				<th>Prüfer:in</th>
				<th>Constraints</th>
				<th>Anmeldungen</th>
				<th>NTA</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredExams as exam}
				<tr class={bg(exam)}>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<td>
						{#if exam.planEntry != null}
							<div class=" flex">
								{#if exam.planEntry.locked}
									<div class="mt-1 mr-2">
										<svg
											viewBox="0 0 100 100"
											class="stroke-current flex-shrink-0 h-3 w-3"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="m78.57 28.57v14.285h10.715c1.9727 0 3.5703 1.6016 3.5703 3.5742v50c0 1.9727-1.5977 3.5703-3.5703 3.5703h-78.57c-1.9727 0-3.5703-1.5977-3.5703-3.5703v-50c0-1.9727 1.5977-3.5742 3.5703-3.5742h10.715v-14.285c0-15.777 12.789-28.57 28.57-28.57s28.57 12.793 28.57 28.57zm-14.285 14.285v-14.285c0-7.8867-6.3945-14.285-14.285-14.285s-14.285 6.3984-14.285 14.285v14.285z"
												fill-rule="evenodd"
											/>
										</svg>
									</div>
								{/if}

								<span>
									{mkStarttime(exam.planEntry.starttime)}
								</span>
							</div>
						{/if}
					</td>
					<td on:click={gotoo(exam.ancode)}
						>{exam.ancode}
						{#each exam.primussExams as primussExam}
							{#if primussExam.exam.ancode != exam.ancode}
								<div class="badge">{primussExam.exam.program}/{primussExam.exam.ancode}</div>
							{/if}
						{/each}
					</td>
					<td>{exam.zpaExam.module}</td>
					<td>{exam.zpaExam.mainExamer}</td>
					<td>
						{#if exam.constraints && exam.constraints.online}
							<div class="badge badge-warning">Online</div>
						{/if}
						{#if exam.constraints && exam.constraints.roomConstraints}
							{#if exam.constraints.roomConstraints.exahmRooms}
								<div class="badge badge-error">EXaHM</div>
							{/if}
							{#if exam.constraints.roomConstraints.seb}
								<div class="badge badge-error">SEB</div>
							{/if}
							{#if exam.constraints.roomConstraints.lab}
								<div class="badge badge-error">Labor</div>
							{/if}
						{/if}
					</td>
					<td>
						{#if regs(exam) == 0}
							<div class="badge badge-error gap-2">{regs(exam)}</div>
						{:else}
							<div class="badge badge-success gap-2">&sum; {regs(exam)}</div>
						{/if}
						{#each exam.primussExams as primussExam}
							{#if primussExam.studentRegs.length > 0}
								<button class="btn btn-xs p-1 mx-1">
									{primussExam.exam.program}
									<div class="badge badge-secondary badge-xs">{primussExam.studentRegs.length}</div>
								</button>
							{/if}
						{/each}
					</td>
					<td>
						{#if !exam.constraints || (exam.constraints && !exam.constraints.notPlannedByMe)}
							{#each exam.primussExams as primussExam}
								{#if primussExam.ntas.length > 0}
									<button class="btn btn-xs p-1 mx-1">
										{primussExam.exam.program}
										<div class="badge badge-secondary badge-xs">{primussExam.ntas.length}</div>
									</button>
									{#each primussExam.ntas as nta}
										{#if nta.needsRoomAlone}
											<div class="badge badge-error">Raum</div>
										{/if}
									{/each}
								{/if}
							{/each}
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
