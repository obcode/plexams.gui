<script>
	import { semester } from '$lib/stores.js';

	let currentSemester;

	const unsubscribe = semester.subscribe((value) => {
		currentSemester = value;
	});
</script>

<nav>
	<a href="/setSemester">{currentSemester}</a>
	<a href="/teacher">Dozenten</a>
	<a href="/invigilators">Aufsichten</a>
	<a href="/zpaexams">Prüfungsliste</a>
</nav>
