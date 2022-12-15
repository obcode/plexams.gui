export function mkDate(datestring) {
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
export function mkDateShort(datestring) {
	const options = { weekday: 'short', month: 'numeric', day: 'numeric' };
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
export function mkDateTimeShort(datestring) {
	const options = {
		weekday: 'short',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	};
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
export function mkStarttime(datestring) {
	const options = {
		month: '2-digit',
		day: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	};
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
