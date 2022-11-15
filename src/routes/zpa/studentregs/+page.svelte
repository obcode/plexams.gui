<script>
	export let data;
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		Fehler beim Importieren der Anmeldungen ins ZPA
	</div>
</div>

{#if data.studenRegsImportErrors && data.studenRegsImportErrors.length > 0}
	<div class="overflow-x-auto my-2">
		<table class="table table-compact w-full">
			<thead>
				<tr>
					<th>AnCode</th>
					<th>Matrikelnummer</th>
					<th>Studiengang</th>
					<th>Fehler</th>
				</tr>
			</thead>
			<tbody>
				{#each data.studentRegsImportErrors as err}
					<tr>
						<td>{err.registration.ancode}</td>
						<td>{err.registration.mtknr}</td>
						<td>{err.registration.program}</td>
						<td
							>{err.error.semester}
							{err.error.ancode}
							{err.error.mtknr}
							{err.error.program}
							{err.error.exam}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="toast toast-center toast-middle">
		<div class="alert alert-success">
			<div>
				<span>Keine Importfehler gefunden!</span>
			</div>
		</div>
	</div>
{/if}
