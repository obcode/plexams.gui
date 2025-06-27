<script lang="ts">
	// import dayGridPlugin from '@fullcalendar/daygrid';
	import FullCalendar from 'svelte-fullcalendar';
	import timeGridPlugin from '@fullcalendar/timegrid';

	export let data: PageData;
	let plannedExams = data.plannedExams;

	let events: any[] = [];

	$: if (plannedExams != null) {
		for (const exam of plannedExams) {
			if (exam.planEntry) {
				let color = '#3788d8';
				if (exam.constraints && exam.constraints.notPlannedByMe) {
					color = '#ff0000';
				}
				events.push({
					title: `${exam.ancode}. ${exam.zpaExam.module} (${exam.zpaExam.mainExamer})`,
					start: exam.planEntry.starttime,
					end: new Date(
						new Date(exam.planEntry.starttime).getTime() + exam.maxDuration * 60000
					).toISOString(),
					color: color
				});
			}
		}
	}

	// function handleDateClick(info: any) {
	// 	options.initialView = 'timeGridDay';
	// 	options.initialDate = info.dateStr;
	// 	options = { ...options }; // trigger reactivity
	// }

	let options = {
		// dateClick: handleDateClick,
		initialDate: '2025-07-07',
		visibleRange: {
			start: '2025-07-07',
			end: '2025-07-26'
		},
		firstDay: 1,
		weekends: false,
		locale: 'de',
		slotMinTime: '08:00:00',
		slotMaxTime: '20:00:00',
		// initialView: 'timeGridWeek',
		initialView: 'timeGrid',
		plugins: [timeGridPlugin],
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: 'timeGrid,timeGridWeek,timeGridDay'
		},
		events: events,
		editable: false,
		selectable: false
	};
</script>

<!-- 
{#each plannedExams as item}
	<div>{item.ancode}</div>
{/each} -->

<FullCalendar {options} />
