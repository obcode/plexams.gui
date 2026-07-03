<!-- @migration-task Error while migrating Svelte code: Cannot set properties of undefined (setting 'next') -->
<!-- @migration-task Error while migrating Svelte code: Cannot set properties of undefined (setting 'next') -->
<!--
	Drop-in-Ersatz für <button>, der bei geschütztem (read-only) Semester
	automatisch deaktiviert wird. Korrektheit liegt am Backend + hooks.server.js;
	diese Komponente ist die UI-Politur (sichtbar deaktiviert + Tooltip).

	Nutzung wie ein normaler Button:
	  <WriteButton class="btn btn-primary btn-sm" disabled={loading} on:click={save}>
	    Speichern
	  </WriteButton>
-->
<script>
	import { page } from '$app/stores';

	let cls = '';
	export { cls as class };
	export let disabled = false;
	/** eigener Tooltip; im Schutz-Modus überschrieben */
	export let title = '';

	$: readOnly = $page.data?.readOnly ?? false;
	$: isDisabled = disabled || readOnly;
	$: tip = readOnly ? 'Semester ist geschützt (nur lesen)' : title;
</script>

<button
	class={cls}
	disabled={isDisabled}
	title={tip || undefined}
	on:click
	{...$$restProps}
>
	<slot />
</button>
