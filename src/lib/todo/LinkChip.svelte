<!-- Ein Link eines Todos als Badge; verlinkt, wenn das Backend ein Ziel liefert. -->
<script>
	import { linkKindInfo } from './todo.js';

	/**
	 * @typedef {Object} Props
	 * @property {{ kind: string, key: string, label?: string, href?: string | null }} link
	 * @property {() => void} [onremove] zeigt ein ✕ zum Entfernen
	 * @property {boolean} [disabled]
	 */

	/** @type {Props} */
	let { link, onremove, disabled = false } = $props();

	let info = $derived(linkKindInfo(link.kind));
	let external = $derived(!!link.href && /^https?:\/\//.test(link.href));
</script>

<span class="badge badge-outline badge-sm h-auto gap-1 py-0.5" title="{info.label}: {link.key}">
	<span aria-hidden="true">{info.icon}</span>
	{#if link.href}
		<a
			class="link link-hover"
			href={link.href}
			target={external ? '_blank' : undefined}
			rel={external ? 'noopener noreferrer' : undefined}>{link.label || link.key}</a
		>
	{:else}
		<span>{link.label || link.key}</span>
	{/if}
	{#if onremove}
		<button
			class="opacity-50 hover:opacity-100"
			aria-label="Link entfernen"
			{disabled}
			onclick={onremove}>✕</button
		>
	{/if}
</span>
