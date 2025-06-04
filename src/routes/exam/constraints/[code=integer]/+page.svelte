<script>
	export let data;
	import { onMount } from 'svelte';

	let constraints = data.constraints;
	let exam = data.exam;
	let semesterConfig = data.semesterConfig;
	let rooms = data.rooms;

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
		allowedRooms: [],
		placesWithSocket: false,
		lab: false,
		seb: false,
		exahm: false,
		excludeDays: [],
		kdpJiraURL: '',
		maxStudents: 0,
		comments: ''
	};

	if (constraints) {
		constraintsInput.notPlannedByMe = constraints.notPlannedByMe;
		constraintsInput.online = constraints.online;
		if (constraints.roomConstraints) {
			constraintsInput.allowedRooms = constraints.roomConstraints.allowedRooms || [];
			constraintsInput.placesWithSocket = constraints.roomConstraints.placesWithSocket;
			constraintsInput.lab = constraints.roomConstraints.lab;
			constraintsInput.seb = constraints.roomConstraints.seb;
			constraintsInput.exahm = constraints.roomConstraints.exahm;
			constraintsInput.kdpJiraURL = constraints.roomConstraints.kdpJiraURL;
			constraintsInput.maxStudents = constraints.roomConstraints.maxStudents;
			constraintsInput.comments = constraints.roomConstraints.comments;
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
		if (!constraintsInput.kdpJiraURL || constraintsInput.kdpJiraURL === '') {
			constraintsInput.kdpJiraURL = null;
		} else {
			constraintsInput.kdpJiraURL = constraintsInput.kdpJiraURL.trim();
		}
		if (!constraintsInput.comments || constraintsInput.comments === '') {
			constraintsInput.comments = null;
		} else {
			constraintsInput.comments = constraintsInput.comments.trim();
		}
		if (!constraintsInput.maxStudents || constraintsInput.maxStudents === 0) {
			constraintsInput.maxStudents = null;
		}

		await fetch('/api/addConstraints', {
			method: 'POST',
			body: JSON.stringify({ ancode: exam.ancode, constraints: constraintsInput }),
			headers: {
				'content-type': 'application/json'
			}
		});
		location.reload();
	}
	function deleteConstraints() {}

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
	let navigateAncode = '';
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
			class:border-green-500={constraintsInput.lab}
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
			class:border-green-500={constraintsInput.seb}
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
			class:border-green-500={constraintsInput.exahm}
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
			class:border-green-500={constraintsInput.placesWithSocket}
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
			class:border-green-500={constraintsInput.online}
		>
			<label class="label">
				<input type="checkbox" class="checkbox" bind:checked={constraintsInput.online} />
				Online
			</label>
		</fieldset>
	</div>
	{#if constraintsInput.seb || constraintsInput.exahm}
		<div class="flex w-full justify-center mt-4">
			<fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-3/4 border p-4">
				<label class="label">
					<span class="label-text">KDP Jira URL</span>
					<input
						type="url"
						class="input input-bordered w-full"
						bind:value={constraintsInput.kdpJiraURL}
						placeholder="https://example.com"
					/>
					{#if constraintsInput.kdpJiraURL}
						<button
							class="btn btn-sm ml-2"
							on:click={() => window.open(constraintsInput.kdpJiraURL, '_blank')}
							disabled={!constraintsInput.kdpJiraURL}
						>
							Link öffnen
						</button>
					{/if}
				</label>
				<label class="label mt-4">
					<span class="label-text">Maximale Anzahl Studierende</span>
					<input
						type="number"
						class="input input-bordered w-full"
						bind:value={constraintsInput.maxStudents}
						placeholder="0"
					/>
				</label>
				<label class="label mt-4">
					<span class="label-text">Kommentare</span>
					<textarea
						class="textarea textarea-bordered w-full"
						bind:value={constraintsInput.comments}
						placeholder="Kommentare eingeben..."
					></textarea>
				</label>
			</fieldset>
		</div>
	{/if}
	<div class="divider">
		Einschränkung auf bestimmte Räume ({constraintsInput.allowedRooms.length} Räume ausgewählt)
	</div>
	<div class="flex w-full justify-center">
		<div class="w-3/4 border rounded-box">
			<div class="flex flex-wrap gap-2 justify-center">
				{#each rooms as room}
					{@const isSelected = constraintsInput.allowedRooms.includes(room.name)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="badge badge-lg cursor-pointer p-4 {isSelected
							? 'bg-green-100 border-green-500'
							: 'bg-base-200'}"
						on:click={() => {
							if (isSelected) {
								constraintsInput.allowedRooms = constraintsInput.allowedRooms.filter(
									(r) => r !== room.name
								);
							} else {
								constraintsInput.allowedRooms = [...constraintsInput.allowedRooms, room.name];
							}
						}}
					>
						{room.name}
					</div>
				{/each}
			</div>
		</div>
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
					<li
						class="flex justify-between items-center bg-green-100 border-green-500 p-2 mb-2 rounded-lg"
					>
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
				class:border-red-500={constraintsInput?.excludeDays?.includes(day)}
				class:bg-green-100={!constraintsInput?.excludeDays?.includes(day)}
				class:border-green-500={!constraintsInput?.excludeDays?.includes(day)}
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
	<button class="btn m-2" on:click={() => (location.href = '/exam/constraints')}
		>Zurück zu allen Constraints</button
	>
	<button class="btn m-2" on:click={() => addConstraints()}>Änderungen übernehmen</button>
	<button class="btn m-2" on:click={() => (showModal = true)}>Constraints anzeigen</button>
</div>
<div class="flex w-full justify-center mt-4">
	<input
		type="number"
		class="input input-bordered w-64 mr-2"
		bind:value={navigateAncode}
		placeholder="Ancode eingeben"
	/>
	<button
		class="btn"
		on:click={() => {
			if (navigateAncode) {
				location.href = `/exam/constraints/${navigateAncode}`;
			}
		}}
	>
		Zu Constraint wechseln
	</button>
</div>

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
