<script>
	import ValidationGroup from '$lib/validation/ValidationGroup.svelte';
	import { invigilationValidators } from '$lib/validation/validators';
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<h1 class="text-2xl font-semibold">Aufsichten validieren</h1>
	<ValidationGroup validators={invigilationValidators} storeId="invigilation" />
</div>
