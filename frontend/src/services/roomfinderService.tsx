import {api, apiFetch, checkResponse} from "@/services/api.tsx";
import type {FreeRoomsPage, RoomAvailability, RoomDaySchedule} from "@/models/Roomfinder.ts";

const BERLIN = "Europe/Berlin";

export function berlinToday(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: BERLIN,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

export function berlinNowTime(): string {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: BERLIN,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date());
    const hour = parts.find(part => part.type === "hour")?.value ?? "00";
    const minute = parts.find(part => part.type === "minute")?.value ?? "00";
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function formatBerlinClock(unixSeconds: number): string {
    return new Intl.DateTimeFormat("de-DE", {
        timeZone: BERLIN,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(new Date(unixSeconds * 1000));
}

/** Floating local datetime for FullCalendar, using the Berlin wall clock of the unix instant. */
export function berlinCalendarDateTime(unixSeconds: number): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: BERLIN,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(unixSeconds * 1000));
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "00";
    return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}:00`;
}

function query(params: Record<string, string>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value.trim()) search.set(key, value.trim());
    }
    return search.toString();
}

async function readJson<T>(response: Response): Promise<T> {
    await checkResponse(response);
    return response.json() as Promise<T>;
}

export async function findFreeRooms(input: {
    date: string;
    time: string;
    endTime: string;
    near: string;
    continuation?: string;
}): Promise<FreeRoomsPage> {
    const response = await apiFetch(
        `${api.baseUrl}/roomfinder/rooms/free?${query({
            date: input.date,
            time: input.time,
            endTime: input.endTime,
            near: input.near,
            continuation: input.continuation ?? "",
        })}`,
    );
    return readJson<FreeRoomsPage>(response);
}

export async function checkRoom(input: {
    room: string;
    date: string;
    time: string;
    endTime: string;
}): Promise<RoomAvailability> {
    const response = await apiFetch(
        `${api.baseUrl}/roomfinder/rooms/${encodeURIComponent(input.room)}/free?${query({
            date: input.date,
            time: input.time,
            endTime: input.endTime,
        })}`,
    );
    return readJson<RoomAvailability>(response);
}

export async function loadDaySchedule(room: string, date: string): Promise<RoomDaySchedule> {
    const response = await apiFetch(
        `${api.baseUrl}/roomfinder/rooms/${encodeURIComponent(room)}/busy?date=${encodeURIComponent(date)}`,
    );
    return readJson<RoomDaySchedule>(response);
}
