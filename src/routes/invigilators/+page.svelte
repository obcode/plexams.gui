<script>
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';

	export let data;

	$: permIds = new Set(data.permanent.map((/** @type {any} */ p) => p.teacherID));
	$: addable = data.candidates.filter((/** @type {any} */ t) => !permIds.has(t.id));

	let teacherID = 0;
	let reason = '';
	let busy = false;
	let error = '';

	async function add() {
		const id = Number(teacherID);
		const r = reason.trim();
		if (!id || !r) return;
		// Namen des gewählten Kandidaten mitschicken (Backend ergänzt ihn, falls leer)
		const t = data.candidates.find((/** @type {any} */ x) => x.id === id);
		const name = t ? t.fullname || t.shortname : '';
		busy = true;
		error = '';
		try {
			const res = await fetch('/api/setPermanentNonInvigilator', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ teacherID: id, name, reason: r })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				error = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			teacherID = 0;
			reason = '';
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	/** @param {any} p */
	async function remove(p) {
		if (!confirm(`Permanente Nicht-Aufsicht für ${p.name} aufheben?`)) return;
		error = '';
		try {
			const res = await fetch('/api/removePermanentNonInvigilator', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ teacherID: p.teacherID })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				error = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Aufsichten — Permanente Nicht-Aufsichten</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.permanent.length}</span>
		<span class="text-sm text-base-content/50"
			>global, semesterübergreifend — z. B. pensioniert</span
		>
	</div>

	<p class="max-w-3xl text-sm text-base-content/60">
		Wer hier steht, macht semesterübergreifend keine Aufsichten und braucht keinen
		semesterspezifischen Eintrag. Semesterbezogene Constraints stehen unter
		<a class="link" href="/plan/invigilation/constraints">Aufsichten-Constraints</a>.
	</p>

	<!-- Hinzufügen -->
	<div class="flex flex-wrap items-end gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Person</span>
			<select class="select select-bordered select-sm w-64" bind:value={teacherID}>
				<option value={0}>Person wählen…</option>
				{#each addable as t}
					<option value={t.id}>{t.shortname} ({t.fullname})</option>
				{/each}
			</select>
		</label>
		<label class="flex flex-1 flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Grund (Pflicht)</span>
			<input
				type="text"
				class="input input-bordered input-sm w-full"
				placeholder="z. B. pensioniert"
				bind:value={reason}
			/>
		</label>
		<WriteButton
			class="btn btn-neutral btn-sm"
			disabled={!teacherID || !reason.trim() || busy}
			on:click={add}
		>
			{busy ? 'speichert…' : 'permanent ausschließen'}
		</WriteButton>
	</div>

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	{#if data.permanent.length}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Person</th>
						<th>Grund</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.permanent as p (p.teacherID)}
						<tr class="hover">
							<td class="font-medium">{p.name}</td>
							<td class="text-base-content/70">{p.reason}</td>
							<td class="text-right">
								<WriteButton class="btn btn-ghost btn-xs text-error" on:click={() => remove(p)}>
									aufheben
								</WriteButton>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="text-sm text-base-content/50">keine</div>
	{/if}
</div>
