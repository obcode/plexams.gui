<script>
	// One row of an uploaded NTA list on /nta/import: what the list says, how it
	// compares with the NTA master data and with the Primuss registrations, and
	// whether it is selected for applying.
	import { STATUS } from '#lib/nta/ntaList.js';

	/**
	 * @typedef {Object} Props
	 * @property {any} row
	 * @property {boolean} checked
	 * @property {any} [edited] the planner's correction of the proposal
	 * @property {boolean} primussRegsAvailable
	 * @property {boolean} [readonly] no selection and no editing (viewer)
	 * @property {(checked: boolean) => void} ontoggle
	 * @property {() => void} onedit
	 */

	/** @type {Props} */
	let { row, checked, edited, primussRegsAvailable, readonly = false, ontoggle, onedit } = $props();

	let p = $derived(edited ?? row.proposal);
	let status = $derived(STATUS[row.status] ?? STATUS.UNCHANGED);
	let significant = $derived(row.changes.filter((/** @type {any} */ c) => c.significant));
	let wording = $derived(row.changes.filter((/** @type {any} */ c) => !c.significant));

	/** @param {any} r */
	const reg = (r) => `${r.stg}:${r.primussAncode}`;
</script>

<tr class="align-top" class:opacity-60={row.status === 'UNCHANGED' && !checked}>
	<td>
		{#if !readonly}
			<input
				type="checkbox"
				class="checkbox checkbox-sm"
				aria-label="{row.name} übernehmen"
				{checked}
				onchange={(e) => ontoggle(/** @type {HTMLInputElement} */ (e.target).checked)}
			/>
		{/if}
	</td>
	<td>
		<span class="badge badge-sm {status.badge} whitespace-nowrap">{status.label}</span>
		{#if edited}
			<span class="badge badge-sm badge-info mt-1 whitespace-nowrap">korrigiert</span>
		{/if}
	</td>
	<td class="min-w-40">
		<div class="font-medium">{p.name}</div>
		<div class="font-mono text-xs text-base-content/60">{row.mtknr}</div>
		<div class="text-xs text-base-content/60">
			{row.stg}{#if p.program && !row.stg.startsWith(p.program)}&nbsp;→ {p.program}{/if}
			{#if row.beginnStudium}· seit {row.beginnStudium}{/if}
		</div>
	</td>
	<td class="min-w-56 max-w-md">
		<div class="text-sm">{row.compensation}</div>
		<div class="mt-1 flex flex-wrap gap-1">
			<span class="badge badge-outline badge-sm">+{p.deltaDurationPercent} %</span>
			{#if p.needsRoomAlone}<span class="badge badge-outline badge-sm">eigener Raum</span>{/if}
			{#if p.needsHardware}<span class="badge badge-outline badge-sm">Hardware</span>{/if}
			<span class="badge badge-ghost badge-sm" title="Spalte semester: {row.validity}">
				bis {p.until || '?'}
			</span>
		</div>
	</td>
	<td class="min-w-64 text-xs">
		{#each row.problems as problem}
			<div class="text-error">⚠ {problem}</div>
		{/each}
		{#if significant.length}
			<div class="font-medium">Abweichung von den Stammdaten:</div>
			<ul class="ml-4 list-disc">
				{#each significant as c}
					<li>
						{c.label}: <s class="text-base-content/50">{c.old || '—'}</s> → <b>{c.new || '—'}</b>
					</li>
				{/each}
			</ul>
		{/if}
		{#if row.status === 'NEW'}
			<div>Noch nicht in den NTA-Stammdaten.</div>
		{/if}
		{#if wording.length}
			<details class="text-base-content/60">
				<summary class="cursor-pointer">
					{row.status === 'UNCHANGED' ? 'Gleicher Inhalt, ' : ''}andere Formulierung ({wording
						.map((/** @type {any} */ c) => c.label)
						.join(', ')})
				</summary>
				<ul class="ml-4 list-disc">
					{#each wording as c}
						<li>
							{c.label}: Stammdaten „{c.old || '—'}“, Liste „{c.new || '—'}“
						</li>
					{/each}
				</ul>
				<div class="mt-1">
					Beim Übernehmen bleibt der Text der Stammdaten, außer es ändert sich auch der Ausgleich.
				</div>
			</details>
		{:else if row.status === 'UNCHANGED'}
			<div class="text-base-content/60">Stimmt mit den Stammdaten überein.</div>
		{/if}
		{#each row.infos as info}
			<div class="text-info">ℹ {info}</div>
		{/each}
		{#if primussRegsAvailable}
			{#if row.regsOnlyInList.length || row.regsOnlyInPrimuss.length}
				<div class="mt-1 text-base-content/70">
					{#if row.regsOnlyInList.length}
						<div>Nur in der Liste angemeldet: {row.regsOnlyInList.map(reg).join(', ')}</div>
					{/if}
					{#if row.regsOnlyInPrimuss.length}
						<div>Nur in Primuss angemeldet: {row.regsOnlyInPrimuss.map(reg).join(', ')}</div>
					{/if}
				</div>
			{:else if row.regs.length}
				<div class="mt-1 text-base-content/50">
					{row.regs.length} Anmeldungen, gleich wie in Primuss
				</div>
			{/if}
		{:else if row.regs.length}
			<div class="mt-1 text-base-content/50">{row.regs.length} Anmeldungen laut Liste</div>
		{/if}
	</td>
	<td>
		{#if !readonly}
			<button class="btn btn-ghost btn-xs" onclick={onedit}>Bearbeiten</button>
		{/if}
	</td>
</tr>
