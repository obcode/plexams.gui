<script>
	import Calendar from '@event-calendar/core';
	import TimeGrid from '@event-calendar/time-grid';

	let events = [
		{
			title: 'Prüfung auto 1',
			start: '2023-07-10 14:30',
			end: '2023-07-10 16:00',
			display: 'auto',
			textColor: 'orange',
			backgroundColor: 'black'
		},
		{
			title: 'Prüfung background',
			start: '2023-07-12 14:30',
			end: '2023-07-12 16:09',
			display: 'background',
			textColor: 'orange',
			backgroundColor: 'black'
		},
		{ title: 'Prüfung auto 2', start: '2023-07-11 14:30', end: '2023-07-11 16:18', display: 'auto' }
	];

	let plugins = [TimeGrid];
	let options = {
		headerToolbar: { start: '', center: '', end: '' },
		locale: 'de-DE',
		theme: function (theme) {
			theme.today = '';
			return theme;
		},

		duration: { weeks: 1 },
		slotMinTime: '07:00',
		slotMaxTime: '22:00',
		allDaySlot: false,
		firstDay: 1,
		hiddenDays: [0, 6],
		events: events
	};
	let options1 = { ...options, date: '2023-07-10' };
	let options2 = { ...options, date: '2023-07-17' };
</script>

<div class="bg-slate-200 rounded-xl p-4 mb-4">
	<Calendar {plugins} options={options1} />
</div>
<div class="bg-slate-200 rounded-xl p-4">
	<Calendar {plugins} options={options2} />
</div>
