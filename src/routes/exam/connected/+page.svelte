<script>
	export let data;

	function differentTitlesOrMainExamer(exam) {
		let diffModule = false;
		let diffMainExamer = false;
		exam.primussExams.forEach((primussExam) => {
			if (primussExam.module !== exam.zpaExam.module) {
				diffModule = true;
			}
			if (primussExam.mainExamer !== exam.zpaExam.mainExamer.replace(',', '')) {
				diffMainExamer = true;
			}
		});
		if ((diffModule && diffMainExamer) || (exam.errors && exam.errors.length > 0)) {
			return 'bg-red-200';
		}
		return 'bg-green-200';
	}
</script>

{#if data && data.connectedExams}
	<div class="w-fit ml-10">
		{#each data.connectedExams as exam}
			<div
				class=" grid grid-cols-2 gap-4 {differentTitlesOrMainExamer(
					exam
				)} p-2 m-1 border border-black rounded-xl"
			>
				<div>
					{exam.zpaExam.ancode}. {exam.zpaExam.module} ({exam.zpaExam.mainExamer}),
					{#each exam.zpaExam.groups as group}
						<span class="badge m-1">{group}</span>
					{/each}
				</div>
				<div>
					<div>
						{#each exam.primussExams as primussExam}
							<div>
								<span class="badge m-1">{primussExam.program}</span>
								{primussExam.ancode}. {primussExam.module}
								({primussExam.mainExamer}),
							</div>
						{/each}
						{#if exam.errors && exam.errors.length > 0}
							<div>
								<ul>
									{#each exam.errors as error}
										<li class="bg-yellow-500 p-1 m-1 rounded-xl">{error}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex items-center justify-center h-screen">
		<div
			style="border-top-color:transparent"
			class="w-16 h-16 border-4 border-red-400 border-solid rounded-full animate-spin"
		/>
	</div>
{/if}
