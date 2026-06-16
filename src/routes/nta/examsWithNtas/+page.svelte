<script>
	export let data;
	let exams = data.examsWithNtas;

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
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		{data.examsWithNtas.length} Prüfungen mit Nachteilsausgleich
	</div>
</div>

<div class="flex justify-center gap-4 mb-4"></div>

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
				<th>Constraints</th>
				<th>NTA</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredExams as exam}
				<tr>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<td>
						{#if exam.planEntry != null}
							<div class=" flex">
								{#if exam.planEntry.locked}
									<div class="mt-1 mr-2">
										<span title="festgelegt">🔒</span>
									</div>
								{/if}

								<span>
									{mkStarttime(exam.planEntry.starttime)}
								</span>
							</div>
						{/if}
					</td>
					<td
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
							{exam.zpaExam.duration} / {exam.maxDuration}
						{:else}
							<div class="badge badge-warning">{exam.zpaExam.duration}</div>
						{/if}
					</td>
					<td>
						{#if exam.constraints && exam.constraints.roomConstraints}
							{#if exam.constraints.roomConstraints.seb}
								<div class="badge badge-warning">SEB</div>
							{/if}
							{#if exam.constraints.roomConstraints.exahm}
								<div class="badge badge-error">EXaHM</div>
							{/if}
						{/if}
					</td>
					<td>
						<ul>
							{#each exam.ntas as nta}
								<li>
									{nta.name}

									<span class="badge">
										+{nta.deltaDurationPercent}% =
										{(exam.zpaExam.duration * (100 + nta.deltaDurationPercent)) / 100} Min.
									</span>
									{#if nta.needsRoomAlone}
										<span class="badge badge-error">Raum</span>
									{/if}
								</li>
							{/each}
						</ul>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
