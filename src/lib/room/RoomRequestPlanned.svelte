<script lang="ts">
	// Belegung eines Raums in einem Slot: geplante Prüfung(en) + NTAs.
	let { planned = [] }: { planned?: any[] } = $props();
</script>

{#if !planned.length}
	<span class="text-xs text-base-content/40">nicht verplant</span>
{:else}
	<div class="flex flex-col gap-1.5">
		{#each planned as ex}
			<div>
				<div class="text-sm">
					<span class="font-medium tabular-nums">{ex.ancode}</span>
					{ex.module}
					<span class="text-base-content/50">
						· {ex.examer}{#if ex.time}
							· {ex.time}{/if} · {ex.duration}′{#if ex.regular}
							· {ex.regular} Plätze{/if}
					</span>
				</div>
				{#if ex.ntas.length}
					<div class="mt-0.5 flex flex-wrap gap-1">
						{#each ex.ntas as n}
							<span class="badge badge-warning badge-sm">
								NTA {n.name} +{n.delta}% → {n.minutes}′
							</span>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
