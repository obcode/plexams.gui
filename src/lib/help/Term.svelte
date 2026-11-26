<script>
	import { glossaryEntry, glossaryHref } from '#lib/help/glossary.js';

	// A term from the glossary: dotted underline, the short explanation as a tooltip
	// (hover and keyboard focus), and a link to the full entry on /hilfe.
	//
	//   <Term id="nta" />            renders the term as the glossary writes it
	//   <Term id="nta">NTAs</Term>   renders the given text

	/**
	 * @typedef {Object} Props
	 * @property {string} id glossary id
	 * @property {import('svelte').Snippet} [children] text to show instead of the term
	 */

	/** @type {Props} */
	let { id, children } = $props();

	let entry = $derived(glossaryEntry(id));
</script>

{#if entry}
	<a
		class="cursor-help underline decoration-dotted decoration-base-content/40 underline-offset-2 hover:decoration-base-content"
		href={glossaryHref(id)}
		title={entry.short}
	>
		{#if children}{@render children()}{:else}{entry.term}{/if}
	</a>
{:else if children}{@render children()}{/if}
