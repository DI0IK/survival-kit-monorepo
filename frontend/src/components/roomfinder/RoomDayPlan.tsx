import {useMemo} from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import deLocale from "@fullcalendar/core/locales/de";
import type {EventContentArg, EventInput} from "@fullcalendar/core";
import type {BusySlot} from "@/models/Roomfinder.ts";
import {berlinCalendarDateTime, formatBerlinClock} from "@/services/roomfinderService.tsx";
import "@/components/roomfinder/RoomDayPlan.css";

type RoomDayPlanProps = {
    room: string;
    date: string;
    slots: BusySlot[];
    windowStart?: number;
    windowEnd?: number;
};

function formatDayLabel(date: string): string {
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date(year, month - 1, day));
}

function minutesOf(iso: string): number {
    const time = iso.slice(11, 16);
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
}

function clock(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function OccupiedEvent({eventInfo}: { eventInfo: EventContentArg }) {
    return (
        <div className="lc-event">
            <div className="lc-event__top">
                <span className="lc-event__title">{eventInfo.event.title}</span>
            </div>
        </div>
    );
}

const RoomDayPlan = ({room, date, slots, windowStart, windowEnd}: RoomDayPlanProps) => {
    const events = useMemo<EventInput[]>(() => {
        const occupied: EventInput[] = slots.map((slot) => ({
            title: `Belegt ${formatBerlinClock(slot.start)}–${formatBerlinClock(slot.end)}`,
            start: berlinCalendarDateTime(slot.start),
            end: berlinCalendarDateTime(slot.end),
            classNames: ["roomfinder-day-plan__occupied"],
        }));
        if (windowStart == null || windowEnd == null) return occupied;
        return [
            ...occupied,
            {
                start: berlinCalendarDateTime(windowStart),
                end: berlinCalendarDateTime(windowEnd),
                display: "background",
                classNames: ["roomfinder-day-plan__window"],
            },
        ];
    }, [slots, windowEnd, windowStart]);

    const {slotMinTime, slotMaxTime} = useMemo(() => {
        let min = 8 * 60;
        let max = 20 * 60;
        for (const event of events) {
            if (typeof event.start !== "string" || typeof event.end !== "string") continue;
            const startDay = event.start.slice(0, 10);
            const endDay = event.end.slice(0, 10);
            const start = startDay < date ? 0 : minutesOf(event.start);
            const end = endDay > date ? 24 * 60 : minutesOf(event.end);
            min = Math.min(min, Math.floor(start / 60) * 60);
            max = Math.max(max, Math.ceil(end / 60) * 60);
        }
        return {slotMinTime: clock(min), slotMaxTime: clock(Math.max(max, min + 60))};
    }, [date, events]);

    return (
        <section className="roomfinder-day-plan" aria-label={`Belegung von ${room}`}>
            <header className="roomfinder-day-plan__header">
                <h2>{room}</h2>
                <p>{formatDayLabel(date)}</p>
            </header>
            <div className="roomfinder-day-plan__calendar">
                <FullCalendar
                    key={`${room}-${date}-${slotMinTime}-${slotMaxTime}-${events.length}`}
                    plugins={[timeGridPlugin]}
                    initialView="timeGridDay"
                    initialDate={date}
                    locale={deLocale}
                    headerToolbar={false}
                    dayHeaders={false}
                    allDaySlot={false}
                    slotMinTime={slotMinTime}
                    slotMaxTime={slotMaxTime}
                    slotDuration="00:30:00"
                    slotLabelInterval="01:00:00"
                    slotLabelFormat={{hour: "2-digit", minute: "2-digit", hourCycle: "h23"}}
                    height="auto"
                    events={events}
                    eventContent={(eventInfo) =>
                        eventInfo.event.display === "background" ? false : <OccupiedEvent eventInfo={eventInfo} />
                    }
                />
            </div>
            <ul className="roomfinder-day-plan__legend">
                <li><span className="roomfinder-day-plan__swatch roomfinder-day-plan__swatch--busy" /> Belegt</li>
                <li><span className="roomfinder-day-plan__swatch roomfinder-day-plan__swatch--window" /> Gesuchte Zeit</li>
            </ul>
            {slots.length === 0 && <p className="roomfinder-day-plan__empty">An diesem Tag ist der Raum frei.</p>}
        </section>
    );
};

export default RoomDayPlan;
