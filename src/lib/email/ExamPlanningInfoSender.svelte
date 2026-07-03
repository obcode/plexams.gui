<script>
	import { run } from 'svelte/legacy';

	import EmailSender from '$lib/email/EmailSender.svelte';

	// „Prüfungsplanungs-Info" an die Prüfenden: erst Empfänger auswählen, dann
	// senden. Versand via Subscription sendEmailExamPlanningInfo(run, teacherIDs).
	// Ersetzt die früheren Einzelversände „Constraints/Wünsche" + „Vorbereitete
	// Prüfungen". Wiederholbar (Versand an Teilmengen / erneut möglich).

	

	/** @param {any[]} exams → „425 Statistik …, 486 Datenbanksysteme" */
	const examList = (exams) =>
		(exams ?? []).map((/** @type {any} */ e) => `${e.ancode} ${e.module}`).join(', ');
	
	/**
	 * @typedef {Object} Props
	 * @property {Array<{ teacher: { id: number, shortname: string, fullname: string, email: string, fk: string, isLBA: boolean }, category: string, exams: { ancode: number, module: string }[] }>} [recipients]
	 * @property {Record<string, boolean>} [conditionsDone]
	 */

	/** @type {Props} */
	let { recipients = [], conditionsDone = {} } = $props();

	let withEmail = $derived(recipients.filter((r) => r.teacher?.email));
	let withoutEmail = $derived(recipients.filter((r) => !r.teacher?.email));

	/** @type {Set<number>} */
	let selected = $state(new Set());
	let initialized = $state(false);
	// Default: alle mit E-Mail ausgewählt (einmalig, sobald Empfänger da sind).
	run(() => {
		if (!initialized && withEmail.length) {
			selected = new Set(withEmail.map((r) => r.teacher.id));
			initialized = true;
		}
	});

	let q = $state('');
	let filtered = $derived(recipients.filter((r) => {
		if (!q.trim()) return true;
		const t = q.trim().toLowerCase();
		return `${r.teacher?.shortname ?? ''} ${r.teacher?.email ?? ''}`.toLowerCase().includes(t);
	}));

	/** @param {number} id */
	function toggle(id) {
		const s = new Set(selected);
		if (s.has(id)) s.delete(id);
		else s.add(id);
		selected = s;
	}
	const selectAll = () => (selected = new Set(withEmail.map((r) => r.teacher.id)));
	const selectNone = () => (selected = new Set());

	let selectedIds = $derived([...selected]);
</script>

<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
	<div class="min-w-0">
		<div class="font-medium">Prüfungsplanungs-Info an Prüfende</div>
		<div class="text-xs text-base-content/50">
			Info zur Prüfungsplanung (Constraints/Wünsche &amp; vorbereitete Prüfungen) an die ausgewählten
			Prüfenden. Empfänger ohne E-Mail werden serverseitig übersprungen.
		</div>
	</div>

	<!-- Empfänger-Auswahl -->
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-sm tabular-nums">
			<strong>{selected.size}</strong> / {withEmail.length} ausgewählt
		</span>
		<button class="btn btn-ghost btn-xs" onclick={selectAll}>alle</button>
		<button class="btn btn-ghost btn-xs" onclick={selectNone}>keine</button>
		{#if withoutEmail.length}
			<span class="badge badge-warning badge-sm">{withoutEmail.length} ohne E-Mail</span>
		{/if}
		<div class="flex-1"></div>
		<input
			class="input input-bordered input-xs w-44"
			type="text"
			bind:value={q}
			placeholder="suchen …"
		/>
	</div>

	<div class="max-h-64 overflow-y-auto rounded-lg border border-base-200 divide-y divide-base-200">
		{#each filtered as r (r.teacher.id)}
			{@const noMail = !r.teacher?.email}
			{@const hasExams = (r.exams?.length ?? 0) > 0}
			<label
				class="flex items-start gap-2 px-2 py-1 text-sm {noMail ? 'opacity-50 ' : 'cursor-pointer '}{hasExams
					? 'bg-success/10 hover:bg-success/20'
					: 'bg-warning/10 hover:bg-warning/20'}"
			>
				<input
					type="checkbox"
					class="checkbox checkbox-xs mt-0.5"
					checked={selected.has(r.teacher.id)}
					disabled={noMail}
					onchange={() => toggle(r.teacher.id)}
				/>
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-x-2">
						<span class="truncate font-medium">{r.teacher.shortname}</span>
						{#if r.teacher.fk && r.teacher.fk !== 'FK07'}
							<span class="badge badge-neutral badge-xs" title="andere Fakultät">{r.teacher.fk}</span
							>
						{/if}
						{#if r.teacher.isLBA}
							<span class="badge badge-info badge-xs" title="Lehrbeauftragte:r">LBA</span>
						{/if}
						{#if noMail}
							<span class="text-xs text-warning">keine E-Mail — übersprungen</span>
						{:else}
							<span class="truncate text-xs text-base-content/40">{r.teacher.email}</span>
						{/if}
					</div>
					<div class="truncate text-xs text-base-content/50" title={examList(r.exams)}>
						{examList(r.exams) || '—'}
					</div>
				</div>
				{#if hasExams}
					<span class="mt-0.5 shrink-0 tabular-nums text-base-content/40"
						>{r.exams.length}&nbsp;Pr.</span
					>
				{:else}
					<span class="mt-0.5 shrink-0 font-medium text-warning">keine&nbsp;Pr.</span>
				{/if}
			</label>
		{:else}
			<div class="px-2 py-3 text-center text-sm text-base-content/40">keine Empfänger</div>
		{/each}
	</div>

	<EmailSender
		emailKey="sendEmailExamPlanningInfo"
		title="Senden"
		description="Probelauf geht nur an dich (Planer); „Wirklich senden“ an die ausgewählten Prüfenden."
		extraArgs={{ teacherIDs: { type: '[Int!]', value: selectedIds } }}
		disabled={selectedIds.length === 0}
		repeatable
		confirmText={`Wirklich an ${selectedIds.length} ausgewählte Prüfende senden?`}
		{conditionsDone}
	/>
</div>
