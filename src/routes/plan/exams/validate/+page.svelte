<script>
	import ValidationGroup from '$lib/validation/ValidationGroup.svelte';
	import { schedulingValidators } from '$lib/validation/validators';
	let { data } = $props();

	let onlyPlannedByMe = $state(true);
	let ancode = $state(0);

	// geplante Prüfungen für das Dropdown: "<ancode>. <module> (<mainexamer>)"
	const exams = [...(data.plannedExams ?? [])]
		.map((/** @type {any} */ e) => ({
			ancode: e.ancode,
			module: e.zpaExam?.module ?? '',
			mainExamer: e.zpaExam?.mainExamer ?? ''
		}))
		.sort((a, b) => a.ancode - b.ancode);

	/** @type {any} */
	let group = $state();

	let argOverrides = $derived({ validateConflicts: { onlyPlannedByMe, ancode } });

	// Bei Änderung der Parameter nur die Konflikt-Prüfung neu starten.
	function rerunConflicts() {
		group?.runByKey('validateConflicts', { onlyPlannedByMe, ancode });
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<h1 class="text-2xl font-semibold">Terminplanung validieren</h1>

	<!-- Parameter für die Konflikt-Prüfung -->
	<div class="flex flex-wrap items-end gap-6 rounded-lg border border-base-300 bg-base-100 p-4">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Konflikte — Umfang</span>
			<label class="label cursor-pointer justify-start gap-3 px-0">
				<input
					type="checkbox"
					class="toggle toggle-primary"
					bind:checked={onlyPlannedByMe}
					onchange={rerunConflicts}
				/>
				<span class="label-text">{onlyPlannedByMe ? 'nur eigene Planung' : 'alle'}</span>
			</label>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Konflikte — Prüfung</span>
			<select
				class="select select-bordered select-sm w-96 max-w-full"
				bind:value={ancode}
				onchange={rerunConflicts}
			>
				<option value={0}>Alle Ancodes</option>
				{#each exams as e}
					<option value={e.ancode}>{e.ancode}. {e.module} ({e.mainExamer})</option>
				{/each}
			</select>
		</label>
	</div>

	<ValidationGroup
		validators={schedulingValidators}
		storeId="scheduling"
		{argOverrides}
		bind:this={group}
	/>
</div>
