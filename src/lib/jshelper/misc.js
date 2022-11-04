export function mkDate(datestring) {
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
