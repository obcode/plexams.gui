<script>
	export let data;

	/** @type {any[]} */
	let logs = data.initial;
	const names = data.names;

	// Filter
	let name = '';
	let ancode = '';
	let argKey = '';
	let argValue = '';
	let since = '';
	let until = '';
	let limit = 200;

	let loading = false;
	let error = '';

	// datetime-local ist Ortszeit → hier (im Browser) zu ISO/UTC machen, damit
	// der Time-Scalar des Servers korrekt filtert.
	/** @param {string} v */
	const toISO = (v) => {
		if (!v) return '';
		const d = new Date(v);
		return Number.isNaN(d.getTime()) ? '' : d.toISOString();
	};

	async function apply() {
		if (loading) return;
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/mutationLog', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name,
					ancode,
					key: argKey,
					value: argValue,
					since: toISO(since),
					until: toISO(until),
					limit
				})
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				error = result?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			logs = result.mutationLog ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function reset() {
		name = '';
		ancode = '';
		argKey = '';
		argValue = '';
		since = '';
		until = '';
		limit = 200;
		logs = data.initial;
	}

	const hasFilter = () => !!(name || ancode || argKey || argValue || since || until);

	/** @param {string} iso */
	function fmt(iso) {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	/** @param {KeyboardEvent} e */
	const onEnter = (e) => e.key === 'Enter' && apply();
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Mutations-Audit-Log</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{logs.length}</span>
		<span class="text-sm text-base-content/50">neueste zuerst</span>
	</div>

	<!-- Filter -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="flex flex-wrap items-end gap-3">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Operation</span>
				<select class="select select-bordered select-sm w-56" bind:value={name} on:change={apply}>
					<option value="">alle</option>
					{#each names as n}
						<option value={n}>{n}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Ancode</span>
				<input
					type="number"
					class="input input-bordered input-sm w-28"
					bind:value={ancode}
					on:keydown={onEnter}
					placeholder="beliebig"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Parameter (key)</span>
				<input
					type="text"
					class="input input-bordered input-sm w-36"
					bind:value={argKey}
					on:keydown={onEnter}
					placeholder="z. B. program"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Wert</span>
				<input
					type="text"
					class="input input-bordered input-sm w-32"
					bind:value={argValue}
					on:keydown={onEnter}
					placeholder="z. B. GS"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">von</span>
				<input type="datetime-local" class="input input-bordered input-sm" bind:value={since} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">bis</span>
				<input type="datetime-local" class="input input-bordered input-sm" bind:value={until} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">max.</span>
				<input
					type="number"
					class="input input-bordered input-sm w-24"
					bind:value={limit}
					on:keydown={onEnter}
				/>
			</label>
			<button class="btn btn-primary btn-sm" disabled={loading} on:click={apply}>
				{loading ? 'lädt …' : 'Filtern'}
			</button>
			{#if hasFilter()}
				<button class="btn btn-ghost btn-sm" on:click={reset}>zurücksetzen</button>
			{/if}
		</div>
	</div>

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	<!-- Liste -->
	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table table-sm">
			<thead>
				<tr>
					<th>Zeit</th>
					<th>Operation</th>
					<th>Typ</th>
					<th>Argumente</th>
					<th>Ancodes</th>
					<th class="text-right">Dauer</th>
				</tr>
			</thead>
			<tbody>
				{#each logs as l}
					<tr class="hover {l.error ? 'bg-error/10' : ''}">
						<td class="tabular-nums whitespace-nowrap text-sm">{fmt(l.time)}</td>
						<td class="font-medium">{l.name}</td>
						<td>
							{#if l.type === 'subscription'}
								<span class="badge badge-info badge-sm">Subscription</span>
							{:else}
								<span class="badge badge-neutral badge-sm">Mutation</span>
							{/if}
						</td>
						<td>
							<div class="flex flex-wrap gap-1">
								{#each l.args ?? [] as a}
									<span class="badge badge-ghost badge-sm">
										<span class="text-base-content/50">{a.key}:</span>&nbsp;{a.value}
									</span>
								{/each}
							</div>
							{#if l.error}
								<div class="mt-1 text-xs text-error">{l.error}</div>
							{/if}
						</td>
						<td>
							<div class="flex flex-wrap gap-1">
								{#each l.ancodes ?? [] as a}
									<span class="badge badge-outline badge-xs tabular-nums">{a}</span>
								{/each}
							</div>
						</td>
						<td class="text-right tabular-nums text-base-content/70">
							{l.type === 'subscription' && !l.durationMs ? '—' : `${l.durationMs} ms`}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="py-8 text-center text-sm text-base-content/50">
							Keine Log-Einträge für diesen Filter.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
