<script>
	import { enhance } from '$app/forms';

	/**
	 * Formular für eine EXaHM/SEB-Meldung: neu (ohne entry) oder Änderung.
	 * Die Prüfung der Eingaben macht das Backend; die HTML-Grenzen hier fangen nur
	 * Tippfehler früh ab.
	 *
	 * @type {{
	 *   programs: { shortname: string, name: string }[],
	 *   teachers?: { id: number, fullname: string }[],
	 *   ownId?: number,
	 *   entry?: any,
	 *   values?: any,
	 *   onCancel?: () => void
	 * }}
	 */
	let { programs, teachers = [], ownId, entry, values, onCancel } = $props();

	// Bei einem abgelehnten Speichern kommen die Eingaben zurück; sonst der Eintrag.
	const start = $derived(values ?? entry ?? {});
	const selected = $derived(new Set(start.programs ?? []));
	let filter = $state('');
	const visible = $derived(
		programs.filter(
			(p) =>
				!filter ||
				p.shortname.toLowerCase().includes(filter.toLowerCase()) ||
				p.name.toLowerCase().includes(filter.toLowerCase()) ||
				selected.has(p.shortname)
		)
	);
	let busy = $state(false);
	const idPrefix = $derived(entry ? `e${entry.id}` : 'new');
</script>

<form
	method="POST"
	action="?/save"
	class="flex flex-col gap-4"
	use:enhance={() => {
		busy = true;
		return async ({ update }) => {
			await update();
			busy = false;
		};
	}}
>
	{#if entry}
		<input type="hidden" name="id" value={entry.id} />
		<input type="hidden" name="expectedRevision" value={entry.revision} />
	{:else if teachers.length > 1}
		<label class="flex flex-col gap-1">
			<span class="text-sm">Prüfende:r</span>
			<select class="select select-bordered w-full sm:w-96" name="onBehalfOf">
				{#each teachers as t (t.id)}
					<option value={t.id} selected={t.id === ownId}>{t.fullname}</option>
				{/each}
			</select>
			<span class="text-xs text-base-content/60">
				Als Prof der FK07 können Sie auch für Lehrbeauftragte melden.
			</span>
		</label>
	{/if}

	<fieldset class="flex flex-wrap gap-4">
		<legend class="mb-1 text-sm">Art</legend>
		{#each ['EXaHM', 'SEB'] as kind (kind)}
			<label class="flex items-center gap-2">
				<input
					type="radio"
					class="radio"
					name="examKind"
					value={kind}
					checked={(start.examKind ?? 'EXaHM') === kind}
				/>
				<span>{kind}</span>
			</label>
		{/each}
	</fieldset>

	<label class="flex flex-col gap-1">
		<span class="text-sm">Modul</span>
		<input
			class="input input-bordered w-full"
			name="module"
			required
			maxlength="200"
			value={start.module ?? ''}
		/>
	</label>

	<fieldset class="flex flex-col gap-2">
		<legend class="text-sm">Studiengänge</legend>
		<input
			class="input input-bordered input-sm w-full sm:w-64"
			placeholder="Filtern …"
			aria-label="Studiengänge filtern"
			bind:value={filter}
		/>
		<div
			class="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded border border-base-300 p-2 sm:grid-cols-2 lg:grid-cols-3"
		>
			{#each visible as p (p.shortname)}
				<label class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						class="checkbox checkbox-sm"
						name="programs"
						value={p.shortname}
						checked={selected.has(p.shortname)}
					/>
					<span><span class="font-mono">{p.shortname}</span> {p.name}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<label class="flex flex-col gap-1">
			<span class="text-sm">Erwartete Anzahl Prüfungsteilnehmende (Schätzung)</span>
			<input
				class="input input-bordered w-full sm:w-40"
				type="number"
				name="expectedStudents"
				min="1"
				max="2000"
				required
				value={start.expectedStudents ?? ''}
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm">Dauer in Minuten (optional)</span>
			<input
				class="input input-bordered w-full sm:w-40"
				type="number"
				name="durationMin"
				min="1"
				max="600"
				value={start.durationMin ?? ''}
			/>
		</label>
	</div>

	<label class="flex flex-col gap-1">
		<span class="text-sm">Bemerkung für die Prüfungsplanung (optional)</span>
		<textarea
			class="textarea textarea-bordered w-full"
			name="remark"
			rows="2"
			maxlength="2000"
			id="{idPrefix}-remark">{start.remark ?? ''}</textarea
		>
	</label>

	<div class="flex flex-wrap gap-2">
		<button class="btn btn-primary" disabled={busy}>
			{entry ? (entry.withdrawn ? 'Erneut melden' : 'Änderung speichern') : 'Melden'}
		</button>
		{#if onCancel}
			<button class="btn btn-ghost" type="button" onclick={onCancel}>Abbrechen</button>
		{/if}
	</div>
</form>
