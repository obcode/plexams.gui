<script>
	export let closingFun;
	import { isOverlayOpen } from '../stores/overlay';
</script>

<div
	class="w-screen h-screen fixed top-0 left-0 flex justify-center items-center bg-gray-100 opacity-95"
>
	<div class="bg-gray-900 text-white rounded-md px-8 py-10 relative max-w-lg">
		<button
			class="absolute top-2 right-3 text-4xl text-gray-300 hover:-translate-y-0 5 transition-transform"
			on:click={() => {
				closingFun();
			}}>&times;</button
		>
		<slot />
	</div>
</div>
