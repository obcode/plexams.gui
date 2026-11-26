<script>
	import ValidationLegend from '#lib/validation/ValidationLegend.svelte';
	import ValidationGroup from '#lib/validation/ValidationGroup.svelte';
	import { invigilationValidators } from '#lib/validation/validators.js';
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<h1 class="text-2xl font-semibold">Aufsichten validieren</h1>
	<ValidationLegend>
		Prüft die Einteilung der Aufsichten: Ist jeder Raum besetzt, hält sich die Einteilung an
		Sperrtage und eigene Prüfungen, und ist die Last fair verteilt? Lass sie nach jedem Einteilen
		und nach jeder Änderung von Hand laufen.
	</ValidationLegend>
	<ValidationGroup validators={invigilationValidators} storeId="invigilation" />
</div>
