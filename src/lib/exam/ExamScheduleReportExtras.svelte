<script>
	// Zwei strukturierte Zusatz-Abschnitte des ExamScheduleReport (Phase A/B):
	//  • exahmNtaAncodes  — EXaHM/SEB-Prüfungen mit NTA, deren NTA-Raum bei der
	//    Raumplanung noch gebucht werden muss (rein informativ, kein Fehler).
	//  • unplacedReasons  — pro nicht geplanter Prüfung der Grund.
	// Beide Ancode-Listen verlinken auf die Prüfungsseite.

	/** @typedef {{ module?: string | null, mainExamer?: string | null }} AncodeInfo */

	/**
	 * @type {{
	 *   exahmNtaAncodes?: number[],
	 *   unplacedReasons?: { ancode: number, reason: string }[],
	 *   infoByAncode?: Record<number, AncodeInfo>
	 * }}
	 */
	let { exahmNtaAncodes = [], unplacedReasons = [], infoByAncode = {} } = $props();

	/** @param {number} ancode */
	function info(ancode) {
		const i = infoByAncode[ancode];
		if (!i) return '';
		return [i.module, i.mainExamer].filter(Boolean).join(' — ');
	}
</script>

{#if exahmNtaAncodes.length}
	<div class="flex flex-col gap-1 rounded-lg border border-info/40 bg-info/10 p-3">
		<span class="text-sm font-medium">
			Bei der Raumplanung einen eigenen Raum für den Nachteilsausgleich buchen ({exahmNtaAncodes.length})
		</span>
		<span class="text-xs text-base-content/60">
			Diese EXaHM/SEB-Prüfungen haben Studierende mit Nachteilsausgleich. Ihre Zeitverlängerung
			wurde hier nicht gegen die gebuchte T-Bau-Zeit geprüft; sie schreiben in einem eigenen Raum,
			den du bei der Raumplanung buchst.
		</span>
		<div class="flex flex-wrap gap-1">
			{#each exahmNtaAncodes as a}
				<a
					href="/exam/assembledExams/{a}"
					class="badge badge-info badge-sm tabular-nums hover:badge-outline"
				>
					{a}
				</a>
			{/each}
		</div>
	</div>
{/if}

{#if unplacedReasons.length}
	<div class="flex flex-col gap-2">
		<h3 class="font-semibold">Nicht eingeplant ({unplacedReasons.length})</h3>
		<div class="overflow-x-auto rounded-lg border border-warning/40">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Ancode</th>
						<th>Modul / Prüfer:in</th>
						<th>Grund</th>
					</tr>
				</thead>
				<tbody>
					{#each unplacedReasons as u}
						<tr>
							<td class="tabular-nums">
								<a href="/exam/assembledExams/{u.ancode}" class="link link-hover font-medium">
									{u.ancode}
								</a>
							</td>
							<td class="text-base-content/70">{info(u.ancode)}</td>
							<td>{u.reason}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
