<script>
	import ValidationLegend from '#lib/validation/ValidationLegend.svelte';
	import ValidationGroup from '#lib/validation/ValidationGroup.svelte';
	import { schedulingValidators } from '#lib/validation/validators.js';
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
	<ValidationLegend>
		Prüft den Terminplan: Welche Studierenden haben Prüfungen zur selben Zeit oder zu dicht
		beieinander, und sind alle Vorgaben eingehalten? Lass sie nach jedem Generieren und nach jedem
		Verschieben laufen.
	</ValidationLegend>

	<!-- Parameter für die Konflikt-Prüfung -->
	<div class="flex flex-wrap items-end gap-6 rounded-lg border border-base-300 bg-base-100 p-4">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Welche Konflikte zeigen?</span>
			<label class="label cursor-pointer justify-start gap-3 px-0">
				<input
					type="checkbox"
					class="toggle toggle-primary"
					bind:checked={onlyPlannedByMe}
					onchange={rerunConflicts}
				/>
				<span class="label-text">
					{onlyPlannedByMe ? 'nur Konflikte, die wir lösen können' : 'alle Konflikte'}
				</span>
			</label>
			<span class="text-xs text-base-content/50">
				{onlyPlannedByMe
					? 'Konflikte zwischen zwei Prüfungen, die beide eine andere Fakultät terminiert, sind ausgeblendet: daran können wir nichts ändern. Alles mit mindestens einer eigenen Prüfung bleibt sichtbar.'
					: 'Zeigt zusätzlich Konflikte zwischen zwei Prüfungen, die beide eine andere Fakultät terminiert. Lösen kann die nur die andere Fakultät.'}
			</span>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">
				Nur Konflikte einer Prüfung zeigen
			</span>
			<select
				class="select select-bordered select-sm w-full sm:w-96"
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
