<!--
	Globaler Bereich „Eigene Eingaben sichern" (REST an plexams.go).

	Der komplette Semester-Dump (ZIP-Download + Restore in eine frische
	Workspace-DB) ist mit der MongoDB-Schicht entfallen — er las und schrieb
	Collections als rohe Dokumente. Die Gesamtsicherung kommt als pg_dump
	zurück; bis dahin bleibt hier der CSV-Export der handgepflegten Daten,
	der als einziger Weg typisiert ist und den Backend-Wechsel übersteht.

	Die einzelnen Datensätze werden weiterhin auf ihrer jeweiligen Seite
	als CSV exportiert/importiert (DatasetCsvTransfer).
-->
<script>
	import { myInputsCsvDownloadUrl } from '$lib/backup/transfer.js';
</script>

<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
	<div class="flex items-center gap-2">
		<span class="font-semibold">Eigene Eingaben sichern</span>
	</div>
	<p class="text-sm text-base-content/60">
		Der Download enthält alle handgepflegten Eingaben (Constraints, Vorplanung, Raumanfragen,
		externe Prüfungen, …) als ZIP mit je einer CSV pro Datensatz. Die CSVs tragen absolute Datums-
		und Zeitangaben und bleiben damit auch dann gültig, wenn sich der Prüfungszeitraum verschiebt.
	</p>

	<div class="flex flex-wrap items-end gap-3">
		<a class="btn btn-outline btn-sm" href={myInputsCsvDownloadUrl()}>⬇️ Meine Eingaben als CSV</a>
	</div>
</div>
