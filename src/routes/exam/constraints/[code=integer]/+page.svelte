<script>
	export let data;
	import { onMount } from 'svelte';

	let constraints = data.constraints;
	let exam = data.exam;
	let semesterConfig = data.semesterConfig;

	let days = semesterConfig.days.map((day) => {
		return new Date(day.date).toLocaleDateString('de-DE', {
			weekday: 'long',
			day: '2-digit',
			month: '2-digit',
			year: '2-digit'
		});
	});

	let constraintsInput = {
		notPlannedByMe: false,
		online: false,
		placesWithSocket: false,
		lab: false,
		seb: false,
		exahm: false,
		excludeDays: []
	};

	if (constraints) {
		constraintsInput.notPlannedByMe = constraints.notPlannedByMe;
		constraintsInput.online = constraints.online;
		if (constraints.roomConstraints) {
			constraintsInput.placesWithSocket = constraints.roomConstraints.placesWithSocket;
			constraintsInput.lab = constraints.roomConstraints.lab;
			constraintsInput.seb = constraints.roomConstraints.seb;
			constraintsInput.exahm = constraints.roomConstraints.exahm;
		}
		if (constraints.excludeDays) {
			constraintsInput.excludeDays =
				constraints.excludeDays.map((day) => {
					return new Date(day).toLocaleDateString('de-DE', {
						weekday: 'long',
						day: '2-digit',
						month: '2-digit',
						year: '2-digit'
					});
				}) || [];
		}
	}

	async function addConstraints() {
		if (sameSlotExams.length > 0) {
			constraintsInput.sameSlot = sameSlotExams.map((exam) => exam.ancode);
		}
		if (constraintsInput.excludeDays.length > 0) {
			constraintsInput.excludeDays = constraintsInput.excludeDays.map((day) => {
				const [weekday, date] = day.split(', ');
				const [dayPart, monthPart, yearPart] = date.split('.');
				return new Date(`20${yearPart}-${monthPart}-${dayPart}T12:00:00`);
			});
		}

		console.log('ConstraintsInput', constraintsInput);

		await fetch('/api/addConstraints', {
			method: 'POST',
			body: JSON.stringify({ ancode: exam.ancode, constraints: constraintsInput }),
			headers: {
				'content-type': 'application/json'
			}
		});
		console.log('Added constraints');
		location.reload();
	}
	function deleteConstraints() {
		console.log('Delete constraints');
	}

	let zpaExamsToPlan = [];
	async function getZpaExamsToPlan() {
		const response = await fetch('/api/zpaexams/toplan', {
			method: 'GET'
		});

		zpaExamsToPlan = await response.json();
	}

	onMount(() => {
		getZpaExamsToPlan();
	});

	let sameSlotExams = [];

	function addExamToSameSlot(exam) {
		if (!sameSlotExams.find((e) => e.ancode === exam.ancode)) {
			sameSlotExams = [...sameSlotExams, exam];
		}
	}

	if (constraints && constraints.sameSlotExams) {
		constraints.sameSlotExams.forEach((sameSlotExam) => addExamToSameSlot(sameSlotExam));
	}

	function removeExamFromSameSlot(exam) {
		sameSlotExams = sameSlotExams.filter((e) => e.ancode !== exam.ancode);
	}
	let filterText = '';
	let showModal = false;

	$: console.log('ConstraintsInput', constraintsInput.excludeDays);
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">
		Constraints<br />
		{exam.ancode}. {exam.module} ({exam.mainExamer})
	</span>
</div>

{#if !constraints}
	<div role="alert" class="alert">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			class="stroke-info shrink-0 w-6 h-6"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			></path></svg
		>
		<span>Keine Constraints vorhanden.</span>
	</div>
{/if}
<div class="divider"></div>
<div class="flex w-full justify-center">
	<fieldset
		class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4 m-4"
		class:bg-red-100={constraintsInput.notPlannedByMe}
	>
		<label class="label">
			<input type="checkbox" class="checkbox" bind:checked={constraintsInput.notPlannedByMe} />
			Nicht von mir geplant
		</label>
	</fieldset>
</div>
{#if !constraintsInput.notPlannedByMe}
	<div class="divider">Raum-Constraints</div>
	<div class="flex w-full justify-center">
		<fieldset
			class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4"
			class:bg-green-100={constraintsInput.lab}
		>
			<label class="label">
				<input type="checkbox" class="checkbox" bind:checked={constraintsInput.lab} />
				Laborräume
			</label>
		</fieldset>
		<div class="divider divider-horizontal"></div>
		<fieldset
			class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4"
			class:bg-green-100={constraintsInput.seb}
		>
			<label class="label">
				<input type="checkbox" class="checkbox" bind:checked={constraintsInput.seb} />
				SafeExamBrowser
			</label>
		</fieldset>
		<div class="divider divider-horizontal"></div>
		<fieldset
			class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4"
			class:bg-green-100={constraintsInput.exahm}
		>
			<label class="label">
				<input type="checkbox" class="checkbox" bind:checked={constraintsInput.exahm} />
				EXaHM
			</label>
		</fieldset>
		<div class="divider divider-horizontal"></div>
		<fieldset
			class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4"
			class:bg-green-100={constraintsInput.placesWithSocket}
		>
			<label class="label">
				<input type="checkbox" class="checkbox" bind:checked={constraintsInput.placesWithSocket} />
				Plätze mit Steckdosen
			</label>
		</fieldset>
		<div class="divider divider-horizontal"></div>
		<fieldset
			class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4"
			class:bg-green-100={constraintsInput.online}
		>
			<label class="label">
				<input type="checkbox" class="checkbox" bind:checked={constraintsInput.online} />
				Online
			</label>
		</fieldset>
	</div>
	<div class="divider">Prüfungen, die im gleichen Slot stattfinden müssen</div>
	<div class="flex w-full justify-center">
		<div class="w-1/2 p-4">
			<h3 class="text-center mb-4">Verfügbare Prüfungen</h3>
			<div>
				<input
					type="text"
					placeholder="Nach Name oder Ancode filtern"
					class="input input-bordered w-full mb-4"
					bind:value={filterText}
				/>
				<div class="overflow-y-auto max-h-32">
					<ul class="list-inside">
						{#each zpaExamsToPlan.filter((exam) => exam.ancode
									.toString()
									.includes(filterText) || exam.module
									.toLowerCase()
									.includes(filterText.toLowerCase()) || exam.mainExamer
									.toLowerCase()
									.includes(filterText.toLowerCase())) as exam (exam.ancode)}
							<li class="flex justify-between items-center">
								<span>
									{exam.ancode}. {exam.module} ({exam.mainExamer})
								</span>
								<button class="btn btn-sm mb-1" on:click={() => addExamToSameSlot(exam)}>
									Hinzufügen
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
		<div class="divider divider-horizontal"></div>
		<div class="w-1/2 p-4">
			<h3 class="text-center mb-4">Ausgewählte Prüfungen</h3>
			<ul class="list-inside">
				{#each sameSlotExams as selectedExam (selectedExam.ancode)}
					<li class="flex justify-between items-center bg-green-100 p-2 mb-2 rounded-lg">
						<span>
							{selectedExam.ancode}. {selectedExam.module} ({selectedExam.mainExamer})
						</span>
						<button class="btn btn-sm mb-1" on:click={() => removeExamFromSameSlot(selectedExam)}>
							Entfernen
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
	<div class="divider">Ausgeschlossene Prüfungstage</div>
	<div class="flex w-full justify-center flex-wrap">
		{#each days as day}
			<fieldset
				class="fieldset bg-base-100 border-base-300 rounded-box w-1/6 border p-4 m-2"
				class:bg-red-100={constraintsInput?.excludeDays?.includes(day)}
				class:bg-green-100={!constraintsInput?.excludeDays?.includes(day)}
			>
				<label class="label">
					<input
						type="checkbox"
						class="checkbox"
						bind:group={constraintsInput.excludeDays}
						value={day}
						checked={constraintsInput?.excludeDays?.includes(day)}
					/>
					{day}
				</label>
			</fieldset>
		{/each}
	</div>
{/if}

<div class="divider"></div>
<div class="flex w-full justify-center">
	<button class="btn m-2" on:click={() => addConstraints()}>Änderungen übernehmen</button>
	<!-- <button class="btn m-2" on:click={() => deleteConstraints()}
		>Alle Constraints für diese Prüfung löschen</button
	> -->
</div>

<button class="btn m-2" on:click={() => (showModal = true)}>Constraints anzeigen</button>

{#if showModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Constraints</h3>
			<div class="mockup-code">
				<pre><code>{JSON.stringify(constraints, undefined, 4)}</code></pre>
			</div>
			<div class="modal-action">
				<button class="btn" on:click={() => (showModal = false)}>Schließen</button>
			</div>
		</div>
	</div>
{/if}
