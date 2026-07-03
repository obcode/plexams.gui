/** @param {string} datestring */
export function mkDate(datestring) {
	/** @type {Intl.DateTimeFormatOptions} */
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
/** @param {string} datestring */
export function mkDateShort(datestring) {
	/** @type {Intl.DateTimeFormatOptions} */
	const options = { weekday: 'short', month: 'numeric', day: 'numeric' };
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
/** @param {string} datestring */
export function mkDateTimeShort(datestring) {
	/** @type {Intl.DateTimeFormatOptions} */
	const options = {
		weekday: 'short',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	};
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
/** @param {string} datestring */
export function mkStarttime(datestring) {
	/** @type {Intl.DateTimeFormatOptions} */
	const options = {
		month: '2-digit',
		day: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	};
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
