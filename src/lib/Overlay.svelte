<script>
	export let isModalOpen;
</script>

<div class="modal" class:modal-open={isModalOpen}>
	<div class="modal-box">
		<slot />
		<div class="modal-action">
			<label for="my-modal" class="btn" on:click={() => (isModalOpen = false)}>OK</label>
		</div>
	</div>
</div>
