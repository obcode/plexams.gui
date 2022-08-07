<script>
	import { semester } from '$lib/stores.js';

	let currentSemester;

	const unsubscribe = semester.subscribe((value) => {
		currentSemester = value;
	});
</script>

<nav>
	<a href="/setSemester">{currentSemester}</a>
	<a href="/zpa/teacher">Dozenten</a>
	<a href="/zpa/invigilators">Aufsichten</a>
	<a href="/zpa/exams">Prüfungsliste (ZPA)</a>
	<a href="/primuss">Prüfungsliste (Primuss)</a>
</nav>
