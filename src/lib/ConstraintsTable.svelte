<script>
	export let examsWithConstraints;

	let filteredExams = [...examsWithConstraints];

	let toShow = 'Alle Constraints';

	let showCfg = [
		'Alle Prüfungen',
		'Alle Constraints',
		'EXaHM-Räume',
		'SafeExamBrowser',
		'Labor',
		'Steckdosen',
		'Nicht von mir geplant'
	];

	$: {
		if (toShow == 'Alle Constraints') {
			filteredExams = examsWithConstraints.filter(
				(exam) => exam.constraints && !exam.constraints.notPlannedByMe
			);
		} else if (toShow == 'EXaHM-Räume') {
			filteredExams = examsWithConstraints.filter(
				(exam) =>
					exam.constraints &&
					exam.constraints.roomConstraints &&
					exam.constraints.roomConstraints.exahm
			);
		} else if (toShow == 'SafeExamBrowser') {
			filteredExams = examsWithConstraints.filter(
				(exam) =>
					exam.constraints &&
					exam.constraints.roomConstraints &&
					exam.constraints.roomConstraints.seb
			);
		} else if (toShow == 'Labor') {
			filteredExams = examsWithConstraints.filter(
				(exam) =>
					exam.constraints &&
					exam.constraints.roomConstraints &&
					exam.constraints.roomConstraints.lab
			);
		} else if (toShow == 'Steckdosen') {
			filteredExams = examsWithConstraints.filter(
				(exam) =>
					exam.constraints &&
					exam.constraints.roomConstraints &&
					exam.constraints.roomConstraints.placesWithSocket
			);
		} else if (toShow == 'Nicht von mir geplant') {
			filteredExams = examsWithConstraints.filter(
				(exam) => exam.constraints && exam.constraints.notPlannedByMe
			);
		} else {
			filteredExams = [...examsWithConstraints];
		}
	}

	async function notPlannedByMe(ancode) {
		await fetch('/api/notPlannedByMe', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		// location.reload();
	}

	function bgConstraints(constraints) {
		if (constraints && constraints.notPlannedByMe) {
			return 'bg-gray-300';
		}
		if (constraints) {
			return 'bg-yellow-200';
		}
		return ' ';
	}
</script>

<div class="flex place-content-center">
	{#each showCfg as showOption}
		<label class="label cursor-pointer m-1 border border-black rounded-xl">
			<input
				type="radio"
				name="radiogrp"
				class="radio radio-success"
				bind:group={toShow}
				value={showOption}
			/>
			<span class="label-text m-2">{showOption}</span>
		</label>
	{/each}
</div>
<div class="overflow-x-auto my-2">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th />
				<th>AnCode</th>
				<th>Module</th>
				<th>Prüfer:in</th>
				<th>Art</th>
				<th>Gruppen</th>
				<th>Gleichzeitig mit</th>
				<th>Nicht am</th>
				<th>Nur am</th>
				<th>Raum-Constraints</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredExams as exam, idx}
				<tr>
					<th class=" ">{idx + 1}.</th>
					<td class={bgConstraints(exam.constraints)}>
						<a href="/exam/constraints/{exam.zpaExam.ancode}">
							{exam.zpaExam.ancode}
						</a>
					</td>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.module}</td>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.mainExamer}</td>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.examType}</td>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.groups}</td>
					<td class={bgConstraints(exam.constraints)}
						>{#if exam.constraints && exam.constraints.sameSlot}
							{#each exam.constraints.sameSlot as ancode, i}
								{ancode}{#if i < exam.constraints.sameSlot.length - 1},
								{/if}
							{/each}
						{/if}</td
					>
					<td class={bgConstraints(exam.constraints)}
						>{#if exam.constraints && exam.constraints.excludeDays}
							<ul>
								{#each exam.constraints.excludeDays as day}
									<li>
										{new Date(day).toLocaleDateString('de-DE', {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</li>
								{/each}
							</ul>
						{/if}</td
					>
					<td class={bgConstraints(exam.constraints)}
						>{#if exam.constraints && exam.constraints.possibleDays}
							<ul>
								{#each exam.constraints.possibleDays as day}
									<li>
										{new Date(day).toLocaleDateString('de-DE', {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</li>
								{/each}
							</ul>
						{/if}</td
					>
					<td class={bgConstraints(exam.constraints)}>
						{#if exam.constraints && exam.constraints.roomConstraints}
							<div class="flex justify-between items-center w-full">
								<div>
									{#if exam.constraints.roomConstraints.allowedRooms && exam.constraints.roomConstraints.allowedRooms.length > 0}
										{exam.constraints.roomConstraints.allowedRooms},
									{/if}
									{#if exam.constraints.roomConstraints.placesWithSocket}
										Plätze mit Steckdosen,
									{/if}
									{#if exam.constraints.roomConstraints.lab}
										Labor,
									{/if}
									{#if exam.constraints.roomConstraints.exahm}
										EXaHM,
									{/if}
									{#if exam.constraints.roomConstraints.seb}
										SafeExamBrowser,
									{/if}
								</div>
								{#if exam.constraints.roomConstraints.kdpJiraURL}
									<div class="flex justify-end">
										<button
											class="btn btn-sm"
											on:click={() =>
												window.open(exam.constraints.roomConstraints.kdpJiraURL, '_blank')}
											disabled={!exam.constraints.roomConstraints.kdpJiraURL}
										>
											Jira-Ticket öffnen
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
