<script>
	export let data;
	let slots = data.slots;
	let hideEmpty = true;

	let filteredSlots = [];
	$: {
		// Wenn der Toggle aktiv ist, zeige Slots mit Prüfungsbedarf ODER verfügbaren T-Räumen
		filteredSlots = hideEmpty
			? slots.filter((s) => (s.exams && s.exams.length > 0) || (s.tRooms && s.tRooms.length > 0))
			: slots;
	}
</script>

<div class="text-center m-4 text-3xl uppercase">KD Räume Übersicht (EXaHM / SEB Bedarf)</div>

<div class="flex items-center gap-4 mb-4">
	<label class="label cursor-pointer gap-2">
		<span class="label-text">Nur Slots mit Bedarf zeigen</span>
		<input type="checkbox" class="toggle toggle-primary" bind:checked={hideEmpty} />
	</label>
	<div class="badge badge-warning">Wdh. = Wiederholungsprüfung</div>
</div>

{#each filteredSlots as slot}
	<div class="collapse bg-base-200 mb-2">
		<input type="checkbox" />
		<div
			class="collapse-title text-xl font-medium flex justify-between"
			class:bg-gray-200={slot.tRooms.length === 0 && (!slot.exams || slot.exams.length === 0)}
			class:bg-red-200={slot.tRooms.length === 0 && slot.exams && slot.exams.length > 0}
			class:bg-green-200={slot.tRooms.length > 0 && slot.exams && slot.exams.length > 0}
			class:bg-yellow-200={slot.tRooms.length > 0 && (!slot.exams || slot.exams.length === 0)}
		>
			<div>
				{#if slot.date}
					{new Date(slot.date).toLocaleDateString()} {slot.start ? ` ${slot.start}` : ''}
				{:else}
					Ungeplant
				{/if}
				<span class="text-sm text-gray-500"> ({slot.day}/{slot.slot})</span>
			</div>
			<div class="text-sm opacity-90 flex items-center gap-3">
				<div class="badge badge-info">T-Räume: {slot.tRooms.length}</div>
				<div class="badge badge-success" style="background-color:transparent;border:1px solid currentColor;padding:0.25rem 0.5rem;">Prüfungen: {slot.exams.length}</div>
			</div>
		</div>
		<div class="collapse-content">
			<div class="grid md:grid-cols-3 gap-4">
				<div class="card bg-base-100 shadow">
					<div class="card-body p-4">
						<h2 class="card-title">Verfügbare T-Räume</h2>
						{#if slot.tRooms.length === 0}
							<div class="text-sm">Keine T-Räume</div>
						{:else}
							<table class="table table-compact w-full">
								<thead><tr><th>Raum</th><th>Sitze</th></tr></thead>
								<tbody>
									{#each slot.tRooms as r}
										<tr><td>{r.name}</td><td>{r.seats}</td></tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				</div>
				<div class="card bg-base-100 shadow md:col-span-2">
					<div class="card-body p-4">
						<h2 class="card-title">Prüfungen mit EXaHM / SEB Bedarf</h2>
						{#if slot.exams.length === 0}
							<div class="text-sm">Keine Prüfungen mit Bedarf</div>
						{:else}
							<table class="table table-compact w-full">
								<thead>
									<tr>
										<th>Ancode</th>
										<th>Modul</th>
										<th>Anmeldungen</th>
										<th>Bedarf</th>
										<th>Geplanter Raum</th>
									</tr>
								</thead>
								<tbody>
									{#each slot.exams as e}
										<tr>
											<td><a class="link" href="/exam/constraints/{e.ancode}">{e.ancode}</a></td>
											<td>{e.module}</td>
											<td>{e.studentRegsCount}</td>
											<td>
												{#if e.wantsExahm}<div class="badge badge-info">EXaHM</div>{/if}
												{#if e.wantsSeb}<div class="badge badge-warning">SEB</div>{/if}
											</td>
											<td>
												{#if e.plannedRooms.length === 0}
													<div class="text-sm">--</div>
												{:else}
													{#each e.plannedRooms as pr}
														<div>
															{pr.name} ({pr.seats})
															{#if pr.prePlanned}<span class="badge badge-accent ml-1">pre</span
																>{/if}
															{#if pr.reserve}<span class="badge badge-secondary ml-1">res</span
																>{/if}
														</div>
													{/each}
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/each}
