<script>
	import { env } from '$env/dynamic/public';
	import { request, gql } from 'graphql-request';

	let ntaInput = {
		name: '',
		mtknr: '',
		compensation: '',
		deltaDurationPercent: 0,
		needsRoomAlone: false,
		program: '',
		from: '',
		until: ''
	};

	let success = false;

	let lastNTA = {};

	async function addNTA() {
		const mutation = gql`
			mutation ($ntaInput: NTAInput!) {
				addNTA(input: $ntaInput) {
					name
					mtknr
					compensation
					deltaDurationPercent
					needsRoomAlone
					program
					from
					until
					lastSemester
					exams {
						ancode
						module
					}
				}
			}
		`;

		const variables = {
			ntaInput
		};

		request(env.PUBLIC_PLEXAMS_SERVER, mutation, variables).then((data) => {
			ntaInput = {
				name: '',
				mtknr: '',
				compensation: '',
				deltaDurationPercent: 0,
				needsRoomAlone: false,
				program: '',
				from: '',
				until: ''
			};
			lastNTA = data.addNTA;
			success = true;
			setTimeout(function () {
				success = false;
			}, 10000);
		});
	}
</script>

{#if success}
	<div class="alert alert-success shadow-lg">
		<div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="stroke-current flex-shrink-0 h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
			<span>Erfolgreich hinzugefügt:</span>
			<span class="text-red-900"> {lastNTA.name}</span>
			<span> mit </span>
			<span class="text-red-900">{lastNTA.compensation}</span>
		</div>
	</div>
{/if}

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		Studierenden mit Nachteilsausgleich hinzufügen
	</div>
</div>

<div class="flex justify-center">
	<div class="card card-side w-4/12 bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="form-control justify-center">
				<span>Name</span>
				<input
					type="text"
					placeholder="Name"
					class="input input-bordered w-full"
					bind:value={ntaInput.name}
				/>

				<span>Matrikelnummer</span>
				<input
					type="text"
					placeholder="MtkNr"
					class="input input-bordered w-full"
					bind:value={ntaInput.mtknr}
				/>

				<span>Kompensation</span>
				<textarea
					class="textarea textarea-bordered w-full"
					placeholder="Kompensation"
					bind:value={ntaInput.compensation}
				/>

				<span>Verlängerung ({ntaInput.deltaDurationPercent} %)</span>
				<input
					type="range"
					min="0"
					max="100"
					class="range"
					step="10"
					bind:value={ntaInput.deltaDurationPercent}
				/>

				<label class="label cursor-pointer">
					<span>
						{#if !ntaInput.needsRoomAlone}
							kein
						{/if}
						eigener Raum</span
					>
					<input type="checkbox" class="checkbox" bind:checked={ntaInput.needsRoomAlone} />
				</label>

				<span>Studiengang</span>
				<input
					type="text"
					placeholder="Studiengang"
					class="input input-bordered w-full"
					bind:value={ntaInput.program}
				/>

				<span>mit Bescheid vom</span>
				<input
					type="text"
					placeholder="Datum"
					class="input input-bordered w-full"
					bind:value={ntaInput.from}
				/>

				<span>NTA gilt bis</span>
				<input
					type="text"
					placeholder="Ende"
					class="input input-bordered w-full"
					bind:value={ntaInput.until}
				/>

				<button class="btn mt-20" on:click={addNTA}>Hinzufügen</button>
			</div>
		</div>
	</div>
</div>
