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
