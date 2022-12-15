<script>
	export let data;
	import { mkStarttime } from '$lib/jshelper/misc.js';
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Prüfungsplan (ZPA)</div>
</div>

<div class="overflow-x-auto">
	<table class="table w-full">
		<thead>
			<tr>
				<th>Ancode</th>
				<th>Modul</th>
				<th>Prüfer</th>
				<th>Termin</th>
			</tr>
		</thead>
		<tbody>
			{#each data.examsInPlan as exam}
				<tr>
					<td>{exam.exam.ancode}</td>
					<td>{exam.exam.zpaExam.module}</td>
					<td>{exam.exam.zpaExam.mainExamer}</td>
					<td>{mkStarttime(exam.slot.starttime)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
