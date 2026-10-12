const BERLIN = "Europe/Berlin";

export function berlinDayKey(date: Date): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: BERLIN,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export function recentBerlinDays(count: number): {date: string; label: string}[] {
    const [year, month, day] = berlinDayKey(new Date()).split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, day));
    start.setUTCDate(start.getUTCDate() - (count - 1));

    return Array.from({length: count}, (_, index) => {
        const current = new Date(start);
        current.setUTCDate(start.getUTCDate() + index);
        const date = current.toISOString().slice(0, 10);
        const label = new Intl.DateTimeFormat("de-DE", {
            timeZone: "UTC",
            day: "2-digit",
            month: "short",
        }).format(current);
        return {date, label};
    });
}
