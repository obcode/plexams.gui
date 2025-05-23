<script>
	export let data;

	let exams = data.zpaExamsToPlanWithConstraints.filter(
		(exam) =>
			exam.constraints &&
			exam.constraints.roomConstraints &&
			(exam.constraints.roomConstraints.exahm || exam.constraints.roomConstraints.seb)
	);
	console.log('exams', exams);
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{exams.length} Prüfungen mit EXaHM oder SEB</span>
</div>

<table class="table-auto table-zebra border-collapse border border-gray-400 w-full text-left">
	<thead>
		<tr>
			<th class="border border-gray-400 px-4 py-2">Ancode</th>
			<th class="border border-gray-400 px-4 py-2">Modulname</th>
			<th class="border border-gray-400 px-4 py-2">Prüfender</th>
			<th class="border border-gray-400 px-4 py-2">EXaHM/SEB</th>
			<th class="border border-gray-400 px-4 py-2">DA</th>
			<th class="border border-gray-400 px-4 py-2">DC</th>
			<th class="border border-gray-400 px-4 py-2">IB</th>
			<th class="border border-gray-400 px-4 py-2">IC</th>
			<th class="border border-gray-400 px-4 py-2">IF</th>
			<th class="border border-gray-400 px-4 py-2">IG</th>
			<th class="border border-gray-400 px-4 py-2">IN</th>
			<th class="border border-gray-400 px-4 py-2">IS</th>
			<th class="border border-gray-400 px-4 py-2">IT</th>
			<th class="border border-gray-400 px-4 py-2">WD</th>
			<th class="border border-gray-400 px-4 py-2">WT</th>
			<th class="border border-gray-400 px-4 py-2">GN</th>
			<th class="border border-gray-400 px-4 py-2">DE</th>
			<th class="border border-gray-400 px-4 py-2">GS</th>
			<th class="border border-gray-400 px-4 py-2">ID</th>
			<th class="border border-gray-400 px-4 py-2">Räume (Studierende)</th>
			<th class="border border-gray-400 px-4 py-2">Räume eingeschränkt</th>
			<th class="border border-gray-400 px-4 py-2">Gruppen</th>
			<th class="border border-gray-400 px-4 py-2">Jira</th>
			<th class="border border-gray-400 px-4 py-2">Vorgeplant</th>
			<th class="border border-gray-400 px-4 py-2">Kommentar</th>
		</tr>
	</thead>
	<tbody>
		{#each exams as exam}
			<tr>
				<td class="border border-gray-400 px-4 py-2"
					>{exam.zpaExam.ancode}
					{#if exam.zpaExam.isRepeaterExam}
						<span class="text-red-500"> (Wiederholung)</span>
					{/if}
				</td>
				<td class="border border-gray-400 px-4 py-2">{exam.zpaExam.module}</td>
				<td class="border border-gray-400 px-4 py-2">{exam.zpaExam.mainExamer}</td>
				<td class="border border-gray-400 px-4 py-2">
					{exam.constraints.roomConstraints.exahm ? 'EXaHM' : 'SEB'}
				</td>
				{#each ['DA', 'DC', 'IB', 'IC', 'IF', 'IG', 'IN', 'IS', 'IT', 'WD', 'WT', 'GN', 'DE', 'GS', 'ID'] as program}
					<td
						class="border border-gray-400 px-4 py-2"
						style="background-color: {exam.zpaExam.primussAncodes.some(
							(ancode) => ancode.program === program
						)
							? 'cyan'
							: 'transparent'}"
					>
					</td>
				{/each}
				<td
					class="border border-gray-400 px-4 py-2"
					style="background-color: {exam.constraints.roomConstraints.maxStudents
						? 'transparent'
						: 'red'}"
				>
					{#if exam.constraints.roomConstraints.maxStudents}
						{Math.ceil(exam.constraints.roomConstraints.maxStudents / 30)} ({exam.constraints
							.roomConstraints.maxStudents})
					{:else}
						fehlt
					{/if}
				</td>
				<td
					class="border border-gray-400 px-4 py-2"
					style="background-color: {exam.constraints.roomConstraints.allowedRooms &&
					exam.constraints.roomConstraints.allowedRooms.length > 0
						? 'yellow'
						: 'transparent'}"
				>
					<ul>
						{#each exam.constraints.roomConstraints.allowedRooms as room}
							<li>{room}</li>
						{/each}
					</ul>
				</td>
				<td class="border border-gray-400 px-4 py-2">{exam.zpaExam.groups.join(', ')}</td>
				<td
					class="border border-gray-400 px-4 py-2"
					style="background-color: {exam.constraints.roomConstraints.kdpJiraURL
						? 'transparent'
						: 'red'}"
				>
					{#if exam.constraints.roomConstraints.kdpJiraURL}
						<a href={exam.constraints.roomConstraints.kdpJiraURL} target="_blank">
							{exam.constraints.roomConstraints.kdpJiraURL.split('/').pop()}
						</a>
					{:else}
						fehlt
					{/if}
				</td>
				<td
					class="border border-gray-400 px-4 py-2"
					style="background-color: {exam.planEntry ? 'cyan' : 'transparent'}"
				>
					{#if exam.planEntry}
						({exam.planEntry.dayNumber}, {exam.planEntry.slotNumber})
					{/if}
				</td>
				<td class="border border-gray-400 px-4 py-2">
					{#if exam.constraints.roomConstraints.comments}
						{exam.constraints.roomConstraints.comments}
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
