// Glossary of the terms a planner meets in this GUI. `short` is the tooltip (one
// sentence), `long` the entry on the help page. Used by Term.svelte and /hilfe.

/**
 * @typedef {Object} GlossaryEntry
 * @property {string} id     anchor on /hilfe (#glossar-<id>)
 * @property {string} term   the term as written in the GUI
 * @property {string} short  one sentence for the tooltip
 * @property {string} long   the full explanation
 */

/** @type {GlossaryEntry[]} */
export const GLOSSARY = [
	{
		id: 'ancode',
		term: 'Ancode',
		short: 'Anmeldecode: die Nummer, unter der eine Prüfung im ZPA und in Plexams geführt wird.',
		long: 'Der Ancode (Anmeldecode) ist die Nummer einer Prüfung. Unter ihm führt das ZPA die Prüfung, und unter ihm melden sich Studierende an. In Plexams ist er der Schlüssel für alles, was zu einer Prüfung gehört. Achtung bei gemeinsamen Studiengängen: dort kann dieselbe Prüfung in Primuss einen anderen Ancode haben als im ZPA.'
	},
	{
		id: 'zpa',
		term: 'ZPA',
		short:
			'Das Verwaltungssystem der Fakultät: Quelle der Prüfungen und Lehrenden, Ziel des fertigen Plans.',
		long: 'Das ZPA ist das Verwaltungssystem der Fakultät. Von dort kommen die offizielle Liste der Prüfungen, die Lehrenden und die Anforderungen der Aufsichten. Dorthin überträgt Plexams am Ende Anmeldungen, Termine, Räume und Aufsichten, und dort sehen Studierende und Lehrende den Plan. ZPA-Daten werden in Plexams nur gelesen; ist dort etwas falsch, wird es im ZPA korrigiert und neu geladen.'
	},
	{
		id: 'primuss',
		term: 'Primuss',
		short: 'Das Anmeldesystem der Hochschule: Quelle der Prüfungsanmeldungen der Studierenden.',
		long: 'In Primuss melden sich die Studierenden zu Prüfungen an. Das Prüfungsamt liefert daraus je Studiengang eine Sammelliste; alle zusammen werden als ZIP in Plexams importiert. Aus den Anmeldungen ergeben sich die Teilnehmerzahlen und die Konflikte zwischen Prüfungen.'
	},
	{
		id: 'sammelliste',
		term: 'Sammelliste',
		short: 'Die Liste aller Prüfungsanmeldungen eines Studiengangs aus Primuss.',
		long: 'Eine Sammelliste enthält alle Prüfungsanmeldungen eines Studiengangs. Das Prüfungsamt stellt sie nach Ende der Anmeldefrist bereit. Plexams importiert alle Sammellisten zusammen als ZIP-Datei.'
	},
	{
		id: 'konflikt',
		term: 'Konflikt',
		short: 'Zwei Prüfungen, zu denen dieselben Studierenden angemeldet sind.',
		long: 'Zwei Prüfungen stehen in Konflikt, wenn mindestens eine Person zu beiden angemeldet ist. Liegen sie zur selben Zeit, kann diese Person nicht beide schreiben; liegen sie am selben Tag oder direkt nacheinander, ist das eine Härte. Die Terminplanung versucht, Konflikte zu vermeiden. Die verbleibenden bewertest du einzeln: hinnehmen, oder eine der Prüfungen verschieben.'
	},
	{
		id: 'aufbereitete-pruefung',
		term: 'Aufbereitete Prüfung',
		short:
			'Eine Prüfung mit allem, was Plexams über sie weiß: ZPA-Daten, Anmeldungen, Nachteilsausgleiche, Vorgaben.',
		long: 'Beim Aufbereiten führt Plexams je Prüfung zusammen, was aus verschiedenen Quellen kommt: die ZPA-Daten, die Anmeldungen aus Primuss, die Nachteilsausgleiche und die Vorgaben. Terminplanung, Raumplanung und Aufsichten arbeiten mit diesen aufbereiteten Prüfungen. Ändert sich eine der Quellen, müssen sie neu generiert werden.'
	},
	{
		id: 'vorgabe',
		term: 'Vorgabe (Constraint)',
		short:
			'Eine Regel für eine einzelne Prüfung, zum Beispiel ein fester Termin oder ausgeschlossene Tage.',
		long: 'Vorgaben (im Programm auch „Constraints") sind Regeln für eine einzelne Prüfung: fester Termin, ausgeschlossene oder allein mögliche Tage, „gleichzeitig mit einer anderen Prüfung", online, besondere Raumanforderungen wie EXaHM, SEB, Labor oder Plätze mit Steckdosen. Der Generator hält sich daran, und die Validierung meldet Verstöße.'
	},
	{
		id: 'gleichzeitig',
		term: 'gleichzeitig (sameSlot)',
		short: 'Zwei Prüfungen, die zur selben Zeit stattfinden müssen.',
		long: 'Die Vorgabe „gleichzeitig" (intern „sameSlot") verlangt, dass zwei Prüfungen zur selben Zeit stattfinden, zum Beispiel weil sie dieselbe Aufgabenstellung haben. Davon zu unterscheiden ist „darf zeitgleich": das erlaubt nur, dass zwei Prüfungen zusammenfallen dürfen, obwohl sie gemeinsame Anmeldungen haben, erzwingt es aber nicht.'
	},
	{
		id: 'nta',
		term: 'NTA',
		short:
			'Nachteilsausgleich: bewilligte Erleichterung für Studierende, etwa mehr Zeit oder ein eigener Raum.',
		long: 'NTA steht für Nachteilsausgleich. Studierende mit bewilligtem Nachteilsausgleich bekommen zum Beispiel eine Zeitverlängerung oder einen eigenen Raum. Plexams berücksichtigt das bei Räumen und Aufsichten: längere Belegung des Raums oder ein eigener Raum. NTAs werden in den Stammdaten gepflegt und gelten über Semester hinweg.'
	},
	{
		id: 'exahm',
		term: 'EXaHM',
		short:
			'Rechnerprüfung in der Prüfungsumgebung der Hochschule; nur in dafür ausgestatteten Räumen möglich.',
		long: 'EXaHM ist die elektronische Prüfungsumgebung der Hochschule. EXaHM-Prüfungen werden an Rechnern geschrieben und können nur in dafür ausgestatteten Räumen stattfinden, vor allem im T-Bau. Diese Räume müssen vorab in Anny gebucht werden. Deshalb werden EXaHM-Prüfungen vor allen anderen geplant.'
	},
	{
		id: 'seb',
		term: 'SEB',
		short: 'Safe Exam Browser: Rechnerprüfung in einem abgesicherten Browser.',
		long: 'SEB steht für Safe Exam Browser. Die Prüfung läuft in einem abgesicherten Browser am Rechner. Wie EXaHM-Prüfungen brauchen SEB-Prüfungen geeignete Räume und werden deshalb früh geplant.'
	},
	{
		id: 'kdp',
		term: 'KDP',
		short: 'Kompetenzzentrum Digitales Prüfen: betreut die Rechnerprüfungen (EXaHM/SEB) technisch.',
		long: 'KDP steht für Kompetenzzentrum Digitales Prüfen. Es betreut die Rechnerprüfungen technisch. Prüfende müssen dort für ihre EXaHM- oder SEB-Prüfung selbst ein Ticket öffnen; die Meldung an die Prüfungsplanung ersetzt das nicht. Von der Prüfungsplanung bekommt das KDP die Übersicht, welche Rechnerprüfung wann in welchem Raum stattfindet.'
	},
	{
		id: 'anny',
		term: 'Anny',
		short: 'Das Buchungssystem für die Räume im T-Bau.',
		long: 'Über Anny werden die Räume im T-Bau gebucht. Gebucht wird in Anny selbst; Plexams ruft die Buchungen nur ab. Eine EXaHM- oder SEB-Prüfung kann nur zu einer Zeit stattfinden, für die es eine Buchung gibt. Buchungen brauchen Vor- und Nachlauf: in der Regel 30 Minuten davor und danach.'
	},
	{
		id: 't-bau',
		term: 'T-Bau',
		short: 'Das Gebäude mit den Räumen für Rechnerprüfungen; gebucht wird über Anny.',
		long: 'Im T-Bau liegen die Räume für Rechnerprüfungen. Sie müssen für jede Prüfungszeit vorab über Anny gebucht werden.'
	},
	{
		id: 'gebaeudemanagement',
		term: 'Gebäudemanagement',
		short: 'Die Stelle, bei der große Räume außerhalb der Fakultät angefragt werden.',
		long: 'Räume, die nicht der Fakultät gehören und nicht über Anny laufen (zum Beispiel der Rote Würfel), werden beim Gebäudemanagement per E-Mail angefragt. Plexams erzeugt die Anfragen aus dem Bedarf des Plans; die Genehmigung trägst du anschließend je Anfrage ein.'
	},
	{
		id: 'slot',
		term: 'Slot',
		short: 'Ein möglicher Prüfungsbeginn: ein Tag mit einer Startzeit.',
		long: 'Ein Slot ist ein möglicher Prüfungsbeginn, also ein Tag zusammen mit einer Startzeit. Die Startzeiten legt die Semester-Konfiguration fest.'
	},
	{
		id: 'probelauf',
		term: 'Probelauf',
		short:
			'Ein Lauf, der alles berechnet und anzeigt, aber nichts speichert und nichts verschickt.',
		long: 'Fast jeder Vorgang mit Folgen hat einen Probelauf: Er rechnet und zeigt das Ergebnis, speichert aber nichts. Bei E-Mails geht im Probelauf alles nur an dich selbst. Nutze ihn immer zuerst.'
	},
	{
		id: 'fixieren',
		term: 'Fixieren',
		short:
			'Einen Termin, Raum oder eine Aufsicht festlegen, sodass ein späterer Generierungslauf sie nicht mehr ändert.',
		long: 'Was fixiert ist, bleibt bei einem späteren Generierungslauf unverändert. So bewahrst du Entscheidungen, die du von Hand getroffen hast, und lässt den Rest neu verteilen.'
	},
	{
		id: 'veroeffentlicht',
		term: 'Veröffentlicht',
		short:
			'Die Veröffentlichungs-E-Mail ist verschickt; danach ist das Neu-Generieren des Bereichs gesperrt.',
		long: 'Ein Plan gilt als veröffentlicht, sobald die Veröffentlichungs-E-Mail verschickt ist (nicht schon mit dem Übertragen ins ZPA). Danach ist das Neu-Generieren dieses Bereichs gesperrt, damit ein bekannter Plan nicht versehentlich durcheinandergerät. Einzelne Änderungen von Hand bleiben möglich. Für einen neuen Lauf nimmst du auf der Startseite das Häkchen zurück.'
	},
	{
		id: 'geschuetzt',
		term: 'Geschütztes Semester',
		short: 'Ein Semester, das nur gelesen werden kann.',
		long: 'Ein abgeschlossenes Semester lässt sich in der Semesterauswahl schützen. Danach kann darin nichts mehr geändert werden. Der Schutz lässt sich dort auch wieder aufheben.'
	},
	{
		id: 'gemeinsame-studiengaenge',
		term: 'Gemeinsame Studiengänge',
		short: 'Studiengänge mit anderen Fakultäten, zum Beispiel MUC.DAI.',
		long: 'Gemeinsame Studiengänge (zum Beispiel MUC.DAI und MUC.HEALTH) werden mit anderen Fakultäten zusammen angeboten. Ihre Studierenden schreiben Prüfungen mehrerer Fakultäten. Deshalb importiert Plexams auch die Prüfungen der anderen Fakultäten und hält für diese Studiengänge teils eigene Zeiten frei.'
	},
	{
		id: 'fk',
		term: 'FK',
		short: 'Fakultät. FK07 ist die eigene Fakultät.',
		long: 'FK steht für Fakultät, FK07 für die eigene. „Prüfungen anderer FKs" sind Prüfungen, die eine andere Fakultät plant; ihre Termine werden nur eingetragen.'
	},
	{
		id: 'lba',
		term: 'LBA',
		short: 'Lehrbeauftragte:r: prüft, gehört aber nicht zum Aufsichtspool.',
		long: 'LBA steht für Lehrbeauftragte:r. Lehrbeauftragte halten Lehrveranstaltungen und prüfen, werden aber nicht zu Aufsichten eingeteilt.'
	},
	{
		id: 'wiederholung',
		term: 'Wdh.',
		short: 'Wiederholungsprüfung.',
		long: '„Wdh." kennzeichnet eine Prüfung, die im ZPA als Wiederholungsprüfung geführt wird. Konflikte mit Wiederholungsprüfungen wiegen in der Terminplanung weniger schwer und gelten zunächst als hingenommen.'
	},
	{
		id: 'aufsicht',
		term: 'Aufsicht',
		short: 'Die Person, die während einer Prüfung in einem Raum Aufsicht führt.',
		long: 'Für jeden Raum und jede Prüfungszeit wird eine Aufsicht eingeteilt, dazu je Zeit eine Reserveaufsicht. Wer seine eigene Prüfung in nur einem Raum schreiben lässt, führt dort selbst Aufsicht.'
	},
	{
		id: 'special-interests',
		term: 'Special Interests',
		short: 'Benannte Listen von Prüfungen, für die ein eigenes Info-PDF erzeugt wird.',
		long: 'Ein Special Interest ist eine benannte Liste von Ancodes. Für jede Liste erzeugt Plexams ein eigenes PDF mit den Terminen genau dieser Prüfungen, zum Beispiel wenn eine Gruppe nur ihre eigenen Prüfungen sehen soll.'
	}
];

/** @type {Record<string, GlossaryEntry>} */
const BY_ID = Object.fromEntries(GLOSSARY.map((e) => [e.id, e]));

/**
 * @param {string} id
 * @returns {GlossaryEntry | undefined}
 */
export function glossaryEntry(id) {
	return BY_ID[id];
}

/** @param {string} id */
export const glossaryHref = (id) => `/hilfe#glossar-${id}`;
