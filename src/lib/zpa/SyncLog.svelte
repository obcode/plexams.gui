<script lang="ts">
	let { entries = [] }: { entries?: any[] } = $props();

	function fmt(iso: string) {
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// neuester Eintrag je operation (entries kommen neueste zuerst)
	const latest = $derived.by(() => {
		const seen = new Map<string, any>();
		for (const e of entries) if (!seen.has(e.operation)) seen.set(e.operation, e);
		return [...seen.values()];
	});

	const dirLabel = (dir: string) => (dir === 'upload' ? '↑ Upload' : '↓ Import');
</script>

<div class="flex flex-col gap-4">
	<!-- Letzter Sync je Operation -->
	<div class="flex flex-col gap-2">
		<div class="text-sm font-semibold text-base-content/70">Letzter Sync je Operation</div>
		{#if latest.length === 0}
			<div class="text-sm text-base-content/50">noch keine Transfers protokolliert</div>
		{:else}
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
				{#each latest as e}
					<div class="rounded-lg border border-base-300 bg-base-100 p-3">
						<div class="flex items-center gap-2">
							{#if e.ok}
								<span class="badge badge-success badge-xs">✓</span>
							{:else}
								<span class="badge badge-error badge-xs">✗</span>
							{/if}
							<span class="text-sm font-medium">{e.label}</span>
						</div>
						<div class="mt-1 text-xs text-base-content/50">{fmt(e.time)}</div>
						<div class="mt-1 text-xs text-base-content/70">{e.summary}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Verlauf -->
	<div class="flex flex-col gap-2">
		<div class="text-sm font-semibold text-base-content/70">Verlauf</div>
		{#if entries.length === 0}
			<div class="text-sm text-base-content/50">—</div>
		{:else}
			<div class="flex flex-col gap-1">
				{#each entries as e}
					<div class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
						<div class="flex flex-wrap items-center gap-2 text-sm">
							{#if e.ok}
								<span class="badge badge-success badge-xs">✓</span>
							{:else}
								<span class="badge badge-error badge-xs">✗</span>
							{/if}
							<span class="font-medium">{e.label}</span>
							<span class="badge badge-ghost badge-xs">{e.system}</span>
							<span class="badge badge-ghost badge-xs">{dirLabel(e.direction)}</span>
							<span class="text-xs text-base-content/50">{fmt(e.time)}</span>
							<span class="flex-1"></span>
							{#if e.added}<span class="badge badge-success badge-xs tabular-nums">+{e.added}</span
								>{/if}
							{#if e.changed}
								<span class="badge badge-warning badge-xs tabular-nums">~{e.changed}</span>
							{/if}
							{#if e.removed}
								<span class="badge badge-error badge-xs tabular-nums">−{e.removed}</span>
							{/if}
						</div>
						<div class="text-xs text-base-content/60">{e.summary}</div>
						{#if e.entries && e.entries.length}
							<details class="mt-1">
								<summary
									class="cursor-pointer text-xs text-base-content/50 hover:text-base-content/80"
								>
									{e.entries.length} Änderungen anzeigen
								</summary>
								<div class="mt-1 flex flex-col gap-0.5 font-mono text-xs">
									{#each e.entries as c}
										{#if c.type === 'added'}
											<div class="text-success">+ {c.name}</div>
										{:else if c.type === 'removed'}
											<div class="text-error">− {c.name}</div>
										{:else}
											<div class="text-warning">~ {c.name}</div>
											{#each c.fields ?? [] as f}
												<div class="pl-4 text-base-content/60">{f.field}: {f.old} → {f.new}</div>
											{/each}
										{/if}
									{/each}
								</div>
							</details>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
