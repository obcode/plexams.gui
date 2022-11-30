<script>
	export let teacherWithNTA;
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="flex justify-between">
			<span class="text-xl text-red-900">
				{teacherWithNTA.teacher.shortname}
			</span>
		</div>
		<ul class="list-disc">
			{#each teacherWithNTA.exams as exam}
				<li>
					<a class="text-blue-900" href="/exam/examWithRegs/{exam.exam.ancode}"
						>{exam.exam.ancode}. {exam.exam.module}</a
					>
					<ul class="list-inside list-disc">
						{#each exam.ntas as nta}
							<li>
								{nta.nta.name}, {nta.nta.compensation}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	</div>
</div>
