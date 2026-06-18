<script>
	import ValidationGroup from '$lib/validation/ValidationGroup.svelte';
	import { roomValidators } from '$lib/validation/validators';
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<h1 class="text-2xl font-semibold">Räume validieren</h1>
	<ValidationGroup validators={roomValidators} />
</div>
