<script>
	import { invalidateAll } from '$app/navigation';

	export let data;

	let listError = '';
	/** @type {any} */
	let editing = null;
	let isNew = false;
	let origName = '';
	let editError = '';
	let saving = false;

	function openAdd() {
		editing = { name: '', filename: '', ancodes: '' };
		origName = '';
		isNew = true;
		editError = '';
	}
	/** @param {any} si */
	function openEdit(si) {
		editing = {
			name: si.name,
			filename: si.filename ?? '',
			ancodes: (si.ancodes ?? []).join(', ')
		};
		origName = si.name;
		isNew = false;
		editError = '';
	}
	const closeEdit = () => (editing = null);

	/** @param {string} s → Ancode-Liste aus „123, 456 789" */
	const parseAncodes = (s) =>
		(s.match(/\d+/g) ?? []).map(Number).filter((n, i, a) => a.indexOf(n) === i);

	async function save() {
		const name = (editing.name ?? '').trim();
		if (!name) {
			editError = 'Name ist Pflicht.';
			return;
		}
		saving = true;
		editError = '';
		try {
			const input = {
				name,
				filename: (editing.filename ?? '').trim() || null,
				ancodes: parseAncodes(editing.ancodes ?? '')
			};
			const res = await fetch('/api/upsertSpecialInterest', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				editError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			// Umbenennen: alten Eintrag entfernen
			if (!isNew && origName && origName !== name) {
				await fetch('/api/deleteSpecialInterest', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ name: origName })
				});
			}
			closeEdit();
			await invalidateAll();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	/** @param {any} si */
	async function del(si) {
		if (!confirm(`Special Interest „${si.name}" löschen?`)) return;
		listError = '';
		try {
			const res = await fetch('/api/deleteSpecialInterest', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: si.name })
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
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Special Interests</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.interests.length}</span>
		<div class="flex-1"></div>
		<button class="btn btn-primary btn-sm" on:click={openAdd}>+ Special Interest</button>
	</div>

	{#if listError}
		<div class="alert alert-error py-2 text-sm"><span>{listError}</span></div>
	{/if}

	{#if data.interests.length === 0}
		<div class="text-sm text-base-content/50">Noch keine Special Interests angelegt.</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Name</th>
						<th>Datei</th>
						<th>Ancodes</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.interests as si (si.name)}
						<tr class="hover">
							<td class="font-medium">{si.name}</td>
							<td class="font-mono text-sm text-base-content/70">{si.filename || '—'}</td>
							<td>
								<div class="flex flex-wrap gap-1">
									{#each si.ancodes ?? [] as a}
										<span class="badge badge-ghost badge-xs tabular-nums">{a}</span>
									{:else}
										<span class="text-base-content/40">—</span>
									{/each}
								</div>
							</td>
							<td class="text-right whitespace-nowrap">
								<button class="btn btn-ghost btn-xs" on:click={() => openEdit(si)}
									>Bearbeiten</button
								>
								<button class="btn btn-ghost btn-xs text-error" on:click={() => del(si)}
									>Löschen</button
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if editing}
	<div class="modal modal-open">
		<div class="modal-box max-w-lg">
			<h2 class="text-lg font-semibold">Special Interest {isNew ? 'anlegen' : editing.name}</h2>
			<div class="mt-3 flex flex-col gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Name</span>
					<input type="text" class="input input-bordered input-sm" bind:value={editing.name} />
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Datei (optional)</span>
					<input type="text" class="input input-bordered input-sm" bind:value={editing.filename} />
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Ancodes</span>
					<input
						type="text"
						class="input input-bordered input-sm"
						bind:value={editing.ancodes}
						placeholder="z. B. 123, 456, 789"
					/>
					<span class="text-xs text-base-content/40">durch Komma/Leerzeichen getrennt</span>
				</label>
			</div>
			{#if editError}
				<div class="alert alert-error mt-3 py-2 text-sm"><span>{editError}</span></div>
			{/if}
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" on:click={closeEdit} disabled={saving}
					>Abbrechen</button
				>
				<button class="btn btn-primary btn-sm" on:click={save} disabled={saving}>
					{saving ? 'speichert …' : 'Speichern'}
				</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={closeEdit}></button>
	</div>
{/if}
