<script>
	export let nta;
	import { mkStarttime } from '$lib/jshelper/misc.js';
</script>

<div class="card bg-base-100 shadow-xl m-2">
	<div class="card-body">
		<div class="flex justify-between">
			<span class="text-xl">
				<span class="text-green-900">
					{nta.nta.name} ({nta.nta.program} / {nta.nta.mtknr})<br />
					<span class=" text-blue-900">
						<a href="mailto:{nta.nta.email}">&lt;{nta.nta.email}&gt;</a>
					</span>
				</span>
			</span>
			{#if nta.nta.needsHardware}
				<div class="badge badge-info">spezielle Hardware</div>
			{/if}
			{#if nta.nta.needsRoomAlone}
				<div class="badge badge-warning">eigener Raum</div>
			{/if}
		</div>
		<div>
			<span class="text-blue-900">
				{nta.nta.compensation}
			</span>
			<span class="text-red-500">
				gültig bis {nta.nta.until}
			</span>
		</div>
		<div>
			<span class="text-black-900">
				<ul>
					<table>
						<tbody>
							{#each nta.exams as exam}
								<tr class="m-2">
									{#if exam.constraints && exam.constraints.notPlannedByMe}
										<td class="text-slate-400">
											{exam.ancode}. {exam.zpaExam.mainExamer}: {exam.zpaExam.module}
										</td>
									{:else}
										<td class="pr-4 pb-2">
											{exam.ancode}. {exam.zpaExam.mainExamer}: {exam.zpaExam.module}
										</td>
										<td class="pr-4">
											{#if exam.roomName}
												<div class="badge badge-success">{exam.roomName}</div>
											{:else}
												<div class="badge badge-warning">noch nicht geplant</div>
											{/if}
										</td>
										<td class="pr-4">
											{#if exam.starttime}
												{mkStarttime(exam.starttime)}
											{:else}
												<div class="badge badge-warning">noch nicht geplant</div>
											{/if}
										</td>
										<td class="pr-4">
											{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.seb}
												<div class="badge badge-error">SEB</div>
											{/if}
											{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.exahm}
												<div class="badge badge-error">EXaHM</div>
											{/if}
										</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</ul>
			</span>
		</div>
	</div>
</div>
