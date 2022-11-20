<script>
	import ExamCard from '../../../lib/ExamCard.svelte';
	import ExamGroupCard from '../../../lib/ExamGroupCard.svelte';
	import ExamsWithRegsTable from '../../../lib/ExamsWithRegsTable.svelte';
	import ExamTypeCard from '../../../lib/ExamTypeCard.svelte';

	export let data;
	console.log(data);
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		{data.ntasWithRegsByTeacher.length} betroffene Prüfer:innen
	</div>
</div>

<div class="overflow-x-auto my-2">
	<table class="table w-full">
		<tbody>
			{#each data.ntasWithRegsByTeacher as entry}
				<tr>
					<td>
						{entry.teacher.shortname}
					</td>

					<td>
						<table>
							{#each entry.exams as exam}
								<tr>
									<td>
										<a href="/exam/examWithRegs/{exam.exam.ancode}"
											>{exam.exam.ancode}. {exam.exam.module}</a
										>
									</td>
									<td>
										<table>
											{#each exam.ntas as nta}
												<tr>
													<td>
														{nta.nta.name}, {nta.nta.compensation}
													</td>
												</tr>
											{/each}
										</table>
									</td>
								</tr>
							{/each}
						</table>
					</td>
					<!-- <td>{exam.module}</td>
					<td>{exam.mainExamer}</td>
					<td>{exam.examTypeFull}</td>
					<td>{exam.groups}</td> -->
				</tr>
			{/each}
		</tbody>
	</table>
</div>
