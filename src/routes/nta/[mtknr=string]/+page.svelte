<script>
	export let data;
	console.log(data);
	const nta = data.nta;
</script>

{#if data.nta == null}
	No NTA found in this semester.
{:else}
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="flex justify-between">
				<span class="text-green-900">
					{nta.nta.name}
				</span>
				<span class="text-green-900" />
			</div>
			<div>
				<span class="text-red-900">
					{nta.nta.compensation}
				</span>
			</div>
			<div>
				<span class="text-blue-900">
					<ul>
						{#each nta.exams as exam}
							<li>{exam.ancode}. {exam.mainExamer}: {exam.module}, {exam.examTypeFull}</li>
						{/each}
					</ul>
				</span>
			</div>
		</div>
	</div>
{/if}
