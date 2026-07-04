<script>
	/**
	 * @typedef {Object} Props
	 * @property {any} req
	 * @property {boolean} [busy]
	 * @property {() => void} [onapprove]
	 * @property {() => void} [onactive]
	 * @property {() => void} [onedittime]
	 */

	/** @type {Props} */
	let { req, busy = false, onapprove, onactive, onedittime } = $props();
</script>

<div class="flex items-center gap-3">
	<label class="label w-28 cursor-pointer justify-start gap-2 px-0" title="genehmigt">
		<input
			type="checkbox"
			class="toggle toggle-sm toggle-success"
			checked={req.approved}
			disabled={busy}
			onchange={() => onapprove?.()}
		/>
		<span
			class="whitespace-nowrap text-xs {req.approved ? 'text-success' : 'text-base-content/50'}"
		>
			{req.approved ? 'genehmigt' : 'offen'}
		</span>
	</label>
	<label
		class="label w-24 cursor-pointer justify-start gap-2 px-0"
		title="aktiv (inaktiv = beim nächsten Vorbereiten der Räume-für-Slots ignoriert)"
	>
		<input
			type="checkbox"
			class="toggle toggle-sm"
			checked={req.active}
			disabled={busy}
			onchange={() => onactive?.()}
		/>
		<span class="whitespace-nowrap text-xs {req.active ? '' : 'text-error'}"
			>{req.active ? 'aktiv' : 'inaktiv'}</span
		>
	</label>
	<button
		class="btn btn-ghost btn-xs"
		disabled={busy}
		title="Zeit bearbeiten / verlängern"
		onclick={() => onedittime?.()}
	>
		✎ Zeit
	</button>
</div>
