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
				<th>Dauer</th>
				<th>Wiederholungsprüfung</th>
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
					<td
						>{exam.mainExamer.shortname}
						{#if exam.mainExamer.isLBA}<div class="badge badge-secondary">LBA</div>{/if}
						{#if exam.mainExamer.fk != 'FK07'}<div class="badge badge-secondary">
								{exam.mainExamer.fk}
							</div>{/if}
					</td>
					<td
						>{#if exam.zpaExam.duration > 0}
							{exam.zpaExam.duration}
						{:else}
							<div class="badge badge-warning">{exam.zpaExam.duration}</div>
						{/if}
					</td>
					<td>
						{#if exam.zpaExam.isRepeaterExam}
							<div class="mt-2 mr-3">
								<svg
									version="1.1"
									viewBox="0 0 100 100"
									class="stroke-current flex-shrink-0 h-3 w-3"
									xmlns="http://www.w3.org/2000/svg"
								>
									<g>
										<path
											d="m83.602 16.398c-9-9-20.898-13.898-33.602-13.898-12.699 0-24.602 4.8984-33.602 13.898s-13.898 20.898-13.898 33.602c0 12.699 4.8984 24.602 13.898 33.602s20.898 13.898 33.602 13.898c12.699 0 24.602-4.8984 33.602-13.898l1.8008-1.8008 0.10156 7.6992c0 2.1016 1.8008 3.8984 3.8984 3.8984h0.10156c2.1992 0 3.8984-1.8008 3.8984-4l-0.30078-17c0-2.1016-1.6992-3.8008-3.8984-3.8984l-17-0.30078c-2.1992 0-3.8984 1.6992-4 3.8984 0 2.1992 1.6992 3.8984 3.8984 4l7.6992 0.10156-1.8008 1.8008c-7.5 7.5-17.398 11.602-28 11.602s-20.602-4.1016-28-11.602-11.699-17.398-11.699-28 4.1992-20.602 11.699-28 17.5-11.602 28-11.602 20.5 4.1016 28 11.602c8.5 8.5 12.602 20.199 11.398 32.199-0.19922 2.1992 1.3008 4.1016 3.5 4.3008 2.1992 0.19922 4.1016-1.3008 4.3008-3.5 1.5-14.398-3.3984-28.398-13.598-38.602z"
										/>
										<path
											d="m38.102 35.602v28.898c0 2.8984 3.1992 4.6992 5.6016 3.1992l23.5-14.398c2.3984-1.3984 2.3984-4.8984 0-6.3008l-23.504-14.602c-2.5-1.5-5.5977 0.30078-5.5977 3.2031z"
										/>
									</g>
								</svg>
							</div>
						{/if}
					</td>
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
