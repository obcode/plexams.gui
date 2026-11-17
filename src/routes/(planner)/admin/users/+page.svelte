<script>
	import { invalidateAll } from '$app/navigation';
	import { ROLES } from '$lib/auth';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	let users = $derived(data.users ?? []);

	// Formular „Benutzer anlegen / Rolle ändern". email ist der Schlüssel: eine
	// vorhandene E-Mail überschreibt (setUser = upsert).
	let email = $state('');
	let name = $state('');
	let role = $state(ROLES[0]);

	let saving = $state(false);
	let error = $state('');
	/** @type {string} */
	let busyEmail = $state('');

	let emailValid = $derived(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()));

	function resetForm() {
		email = '';
		name = '';
		role = ROLES[0];
	}

	async function post(/** @type {string} */ url, /** @type {any} */ body) {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) throw new Error(d?.error || `Fehler (HTTP ${res.status})`);
		return d;
	}

	async function saveUser() {
		if (saving || !emailValid) return;
		saving = true;
		error = '';
		try {
			await post('/api/admin/setUser', { email: email.trim(), name: name.trim(), role });
			resetForm();
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	async function changeRole(/** @type {any} */ u, /** @type {string} */ newRole) {
		if (busyEmail || newRole === u.role) return;
		busyEmail = u.email;
		error = '';
		try {
			await post('/api/admin/setUser', { email: u.email, name: u.name ?? '', role: newRole });
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busyEmail = '';
		}
	}

	async function remove(/** @type {any} */ u) {
		if (busyEmail) return;
		if (!confirm(`Benutzer „${u.name || u.email}" wirklich entfernen?`)) return;
		busyEmail = u.email;
		error = '';
		try {
			await post('/api/admin/removeUser', { email: u.email });
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busyEmail = '';
		}
	}

	// Auswahlliste = bekannte Rollen + evtl. abweichende Rollen aus dem Bestand.
	let roleOptions = $derived([
		...new Set([...ROLES, ...users.map((/** @type {any} */ u) => u.role)])
	]);
</script>

<svelte:head><title>Benutzerverwaltung · Plexams</title></svelte:head>

<div class="mx-auto max-w-4xl py-6">
	<header class="mb-6">
		<h1 class="text-2xl font-bold">👥 Benutzerverwaltung</h1>
		<p class="mt-1 text-sm text-base-content/60">
			Rollen der über OIDC angemeldeten Benutzer verwalten. <span class="font-medium">VIEWER</span>
			ist nur-lesend; Schreibvorgänge dieser Rolle lehnt das Backend ab.
		</p>
	</header>

	{#if !data.available}
		<div class="alert alert-warning">
			<span>
				Benutzerliste nicht verfügbar — dies erfordert eine ADMIN-Rolle und ein Backend mit
				OIDC-Auth.
				{#if data.loadError}<span class="mt-1 block font-mono text-xs opacity-70"
						>{data.loadError}</span
					>{/if}
			</span>
		</div>
	{:else}
		{#if error}
			<div class="alert alert-error mb-4">
				<span class="font-mono text-sm break-words whitespace-pre-wrap">{error}</span>
				<button class="btn btn-ghost btn-xs" onclick={() => (error = '')}>schließen</button>
			</div>
		{/if}

		<!-- Benutzer anlegen / Rolle setzen -->
		<div class="card mb-6 border border-base-300 bg-base-100 shadow-sm">
			<div class="card-body gap-3 p-4">
				<h2 class="text-sm font-semibold text-base-content/70">Benutzer anlegen / Rolle setzen</h2>
				<div class="flex flex-wrap items-end gap-3">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">E-Mail</span>
						<input
							type="email"
							class="input input-bordered input-sm w-full sm:w-64"
							bind:value={email}
							placeholder="vorname.nachname@hm.edu"
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Name</span>
						<input
							type="text"
							class="input input-bordered input-sm w-full sm:w-56"
							bind:value={name}
							placeholder="Vorname Nachname"
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Rolle</span>
						<select class="select select-bordered select-sm w-full sm:w-40" bind:value={role}>
							{#each roleOptions as r}
								<option value={r}>{r}</option>
							{/each}
						</select>
					</label>
					<button
						class="btn btn-primary btn-sm"
						disabled={saving || !emailValid}
						onclick={saveUser}
					>
						{saving ? 'speichert …' : 'Speichern'}
					</button>
				</div>
				{#if email.trim() && !emailValid}
					<span class="text-xs text-error">Bitte eine gültige E-Mail-Adresse eingeben.</span>
				{/if}
			</div>
		</div>

		<!-- Bestandsliste -->
		<div class="overflow-x-auto rounded-xl border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Name</th>
						<th>E-Mail</th>
						<th>Rolle</th>
						<th class="text-right">Aktion</th>
					</tr>
				</thead>
				<tbody>
					{#each users as u (u.email)}
						<tr class:opacity-50={busyEmail === u.email}>
							<td class="font-medium">{u.name || '—'}</td>
							<td class="break-all text-base-content/70">{u.email}</td>
							<td>
								<select
									class="select select-bordered select-xs w-32"
									value={u.role}
									disabled={busyEmail === u.email}
									onchange={(e) =>
										changeRole(u, /** @type {HTMLSelectElement} */ (e.currentTarget).value)}
								>
									{#each roleOptions as r}
										<option value={r}>{r}</option>
									{/each}
								</select>
							</td>
							<td class="text-right">
								<button
									class="btn btn-ghost btn-xs text-error"
									disabled={busyEmail === u.email}
									onclick={() => remove(u)}
								>
									Entfernen
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="text-center text-base-content/50">Noch keine Benutzer.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
