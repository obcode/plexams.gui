<!--
	Drop-in-Ersatz für <button>, der bei geschütztem (read-only) Semester
	automatisch deaktiviert wird. Korrektheit liegt am Backend + hooks.server.js;
	diese Komponente ist die UI-Politur (sichtbar deaktiviert + Tooltip).

	Nutzung wie ein normaler Button:
	  <WriteButton class="btn btn-primary btn-sm" disabled={loading} onclick={save}>
	    Speichern
	  </WriteButton>
-->
<script>
	import { page } from '$app/stores';

	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {boolean} [disabled]
	 * @property {string} [title] eigener Tooltip; im Schutz-Modus überschrieben
	 * @property {(event: MouseEvent) => void} [onclick]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & Record<string, any>} */
	let { class: cls = '', disabled = false, title = '', onclick, children, ...rest } = $props();

	let readOnly = $derived($page.data?.readOnly ?? false);
	let isDisabled = $derived(disabled || readOnly);
	let tip = $derived(readOnly ? 'Semester ist geschützt (nur lesen)' : title);
</script>

<button class={cls} disabled={isDisabled} title={tip || undefined} {onclick} {...rest}>
	{@render children?.()}
</button>
