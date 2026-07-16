<script>
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';

	let { data } = $props();

	const CAT_LABEL = /** @type {Record<string, string>} */ ({
		fk07: 'FK07',
		joint: 'Gemeinsame Studiengänge',
		misc: 'Sonstige'
	});
	const CAT_ORDER = ['fk07', 'joint', 'misc'];

	let byCat = $derived(
		(() => {
			/** @type {Map<string, any[]>} */
			const m = new Map();
			for (const p of data.programs) {
				const k = p.category || 'misc';
				if (!m.has(k)) m.set(k, []);
				m.get(k)?.push(p);
			}
			const keys = [...m.keys()].sort((a, b) => {
				const ia = CAT_ORDER.indexOf(a);
				const ib = CAT_ORDER.indexOf(b);
				return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
			});
			return keys.map((k) => ({ key: k, label: CAT_LABEL[k] ?? k, items: m.get(k) ?? [] }));
		})()
	);
	let missingName = $derived(
		data.programs.filter((/** @type {any} */ p) => !(p.name ?? '').trim()).length
	);

	let listError = $state('');
	let seedMsg = $state('');
	let seeding = $state(false);
	/** @type {Set<string>} */
	let busy = $state(new Set());

	// ---- Editor (anlegen/ändern; Schlüssel = shortname) ----
	/** @type {any} */
	let editing = $state(null);
	let isNew = $state(false);
	let editError = $state('');
	let saving = $state(false);

	function openAdd() {
		editing = {
			shortname: '',
			name: '',
			degree: '',
			category: 'fk07',
			active: true,
			retired: false,
			externalExamsBase: '',
			jointFaculty: ''
		};
		isNew = true;
		editError = '';
	}
	/** @param {any} p */
	function openEdit(p) {
		editing = {
			shortname: p.shortname,
			name: p.name ?? '',
			degree: p.degree ?? '',
			category: p.category || 'misc',
			active: !!p.active,
			retired: !!p.retired,
			externalExamsBase: p.externalExamsBase ?? '',
			jointFaculty: p.jointFaculty ?? ''
		};
		isNew = false;
		editError = '';
	}
	const closeEdit = () => (editing = null);

	/** @param {any} input */
	async function upsert(input) {
		const res = await fetch('/api/studyprogram/upsertStudyProgram', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ input })
		});
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) throw new Error(d?.error || `Fehler (HTTP ${res.status})`);
	}

	async function save() {
		const sn = (editing.shortname ?? '').trim();
		if (!sn) {
			editError = 'Kürzel ist Pflicht.';
			return;
		}
		saving = true;
		editError = '';
		try {
			await upsert({
				shortname: sn,
				name: editing.name ?? '',
				degree: (editing.degree ?? '').trim() || null,
				category: editing.category || 'misc',
				active: !!editing.active,
				retired: !!editing.retired,
				externalExamsBase:
					editing.externalExamsBase === '' || editing.externalExamsBase == null
						? null
						: Number(editing.externalExamsBase),
				jointFaculty:
					editing.category === 'joint' && (editing.jointFaculty ?? '').trim()
						? editing.jointFaculty.trim()
						: null
			});
			closeEdit();
			await invalidateAll();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	/** @param {any} p */
	async function toggleActive(p) {
		if (busy.has(p.shortname)) return;
		busy = new Set(busy).add(p.shortname);
		listError = '';
		try {
			await upsert({
				shortname: p.shortname,
				name: p.name ?? '',
				degree: p.degree ?? null,
				category: p.category || 'misc',
				active: !p.active,
				retired: !!p.retired,
				externalExamsBase: p.externalExamsBase ?? null,
				jointFaculty: p.jointFaculty ?? null
			});
			await invalidateAll();
		} catch (e) {
			listError = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(busy);
			s.delete(p.shortname);
			busy = s;
		}
	}

	/** @param {any} p */
	async function del(p) {
		if (!confirm(`Studiengang ${p.shortname} löschen?`)) return;
		listError = '';
		try {
			const res = await fetch('/api/studyprogram/deleteStudyProgram', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ shortname: p.shortname })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				listError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (e) {
			listError = e instanceof Error ? e.message : String(e);
		}
	}

	async function seed() {
		if (seeding) return;
		seeding = true;
		seedMsg = '';
		listError = '';
		try {
			const res = await fetch('/api/studyprogram/seedStudyProgramsFromConfig', { method: 'POST' });
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				listError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			const n = d.seedStudyProgramsFromConfig ?? 0;
			seedMsg =
				n > 0
					? `${n} Studiengang/Studiengänge neu angelegt.`
					: 'Keine neuen — alles aus der Config ist bereits angelegt.';
			await invalidateAll();
		} catch (e) {
			listError = e instanceof Error ? e.message : String(e);
		} finally {
			seeding = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Studiengänge</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.programs.length}</span>
		{#if missingName > 0}
			<span class="badge badge-warning badge-lg tabular-nums">{missingName} ohne Name</span>
		{/if}
		<span class="text-sm text-base-content/50">global, semesterübergreifend</span>
		<div class="flex-1"></div>
		<WriteButton class="btn btn-outline btn-sm" disabled={seeding} onclick={seed}>
			{seeding ? 'füllt …' : 'fehlende aus Config anlegen'}
		</WriteButton>
		<button class="btn btn-primary btn-sm" onclick={openAdd}>+ Studiengang</button>
	</div>

	{#if seedMsg}
		<div class="alert alert-success py-2 text-sm"><span>{seedMsg}</span></div>
	{/if}
	{#if listError}
		<div class="alert alert-error py-2 text-sm"><span>{listError}</span></div>
	{/if}

	{#if data.programs.length === 0}
		<div class="text-sm text-base-content/50">
			Noch keine Studiengänge — „fehlende aus Config anlegen" füllt sie aus der Config.
		</div>
	{:else}
		{#each byCat as group}
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<span class="font-semibold">{group.label}</span>
					<span class="badge badge-ghost badge-sm">{group.items.length}</span>
				</div>
				<div class="overflow-x-auto rounded-lg border border-base-300">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Kürzel</th>
								<th>Name</th>
								<th>Abschluss</th>
								<th>aktiv</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each group.items as p (p.shortname)}
								<tr class="hover {p.active ? '' : 'opacity-50'}">
									<td class="font-mono font-medium">{p.shortname}</td>
									<td>
										{#if (p.name ?? '').trim()}
											{p.name}
										{:else}
											<span class="text-warning">— Name fehlt</span>
										{/if}
										{#if p.retired}
											<span
												class="badge badge-warning badge-sm ml-1"
												title="ausgelaufenes Programm"
											>
												ausgelaufen
											</span>
										{/if}
										{#if p.jointFaculty}
											<span
												class="badge badge-info badge-sm ml-1"
												title="gemeinsame Studienfakultät"
											>
												{p.jointFaculty}
											</span>
										{/if}
										{#if p.externalExamsBase != null}
											<span
												class="badge badge-ghost badge-sm ml-1 tabular-nums"
												title="Basis-Ancode — lokaler ZPA-Ancode = Basis + Primuss-Ancode"
											>
												Basis {p.externalExamsBase}
											</span>
										{/if}
									</td>
									<td class="text-sm text-base-content/70">{p.degree || '—'}</td>
									<td>
										<input
											type="checkbox"
											class="toggle toggle-sm"
											checked={p.active}
											disabled={busy.has(p.shortname)}
											onchange={() => toggleActive(p)}
										/>
									</td>
									<td class="text-right whitespace-nowrap">
										<button class="btn btn-ghost btn-xs" onclick={() => openEdit(p)}
											>Bearbeiten</button
										>
										<WriteButton class="btn btn-ghost btn-xs text-error" onclick={() => del(p)}
											>Löschen</WriteButton
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/each}
	{/if}
</div>

<!-- Editor -->
{#if editing}
	<div class="modal modal-open">
		<div class="modal-box max-w-md">
			<h2 class="text-lg font-semibold">
				Studiengang {isNew ? 'anlegen' : editing.shortname}
			</h2>
			<div class="mt-3 flex flex-col gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Kürzel</span>
					<input
						type="text"
						class="input input-bordered input-sm w-32 font-mono"
						bind:value={editing.shortname}
						disabled={!isNew}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Name</span>
					<input type="text" class="input input-bordered input-sm" bind:value={editing.name} />
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Abschluss (optional)</span>
					<input
						type="text"
						class="input input-bordered input-sm w-40"
						bind:value={editing.degree}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Kategorie</span>
					<select class="select select-bordered select-sm w-40" bind:value={editing.category}>
						<option value="fk07">FK07</option>
						<option value="joint">Gemeinsamer Studiengang</option>
						<option value="misc">Sonstige</option>
					</select>
				</label>
				{#if editing.category === 'joint'}
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Studienfakultät</span>
						<input
							type="text"
							class="input input-bordered input-sm w-40"
							bind:value={editing.jointFaculty}
							placeholder="z. B. MUC.DAI"
						/>
						<span class="text-xs text-base-content/40">
							gemeinsame Studienfakultät (z. B. MUC.DAI, MUC.HEALTH)
						</span>
					</label>
				{/if}
				<label class="flex cursor-pointer items-center gap-2">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={editing.active} />
					<span>aktiv</span>
				</label>
				{#if editing.category !== 'fk07'}
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60"
							>Basis-Ancode (externe Prüfungen)</span
						>
						<input
							type="number"
							class="input input-bordered input-sm w-40"
							bind:value={editing.externalExamsBase}
							placeholder="z. B. 9000"
						/>
						<span class="text-xs text-base-content/40">
							lokaler ZPA-Ancode = Basis + Primuss-Ancode
						</span>
					</label>
				{/if}
				{#if editing.category === 'fk07'}
					<label class="flex cursor-pointer items-center gap-2">
						<input type="checkbox" class="checkbox checkbox-sm" bind:checked={editing.retired} />
						<span
							>ausgelaufenes Programm <span class="text-base-content/50">(altes oldprogram)</span
							></span
						>
					</label>
				{/if}
			</div>
			{#if editError}
				<div class="alert alert-error mt-3 py-2 text-sm"><span>{editError}</span></div>
			{/if}
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={closeEdit} disabled={saving}>Abbrechen</button
				>
				<WriteButton class="btn btn-primary btn-sm" onclick={save} disabled={saving}>
					{saving ? 'speichert …' : 'Speichern'}
				</WriteButton>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={closeEdit}></button>
	</div>
{/if}
