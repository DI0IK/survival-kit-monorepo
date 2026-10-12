import type {Lecture} from "@/models/Lecture.tsx";

export const clockMinutes = (time: string): number => {
    const [hours = "0", minutes = "0"] = time.split(":");
    return Number(hours) * 60 + Number(minutes);
};

export const selectCurrentTimerLectures = (
    overlapping: Lecture[],
    random: () => number = Math.random
): Lecture[] => {
    if (overlapping.length <= 1) {
        return overlapping;
    }

    const sorted = [...overlapping].sort((left, right) =>
        clockMinutes(left.startTime) - clockMinutes(right.startTime)
        || left.title.localeCompare(right.title)
    );
    const earliestStart = clockMinutes(sorted[0].startTime);
    const tiedForEarliest = sorted.filter(lecture => clockMinutes(lecture.startTime) === earliestStart);
    const later = sorted.filter(lecture => clockMinutes(lecture.startTime) !== earliestStart);
    const pick = (items: Lecture[]) =>
        items[Math.min(items.length - 1, Math.max(0, Math.floor(random() * items.length)))];

    if (tiedForEarliest.length === 1) {
        return [tiedForEarliest[0], pick(later)];
    }

    const primary = pick(tiedForEarliest);
    const pool = tiedForEarliest.filter(lecture => lecture !== primary).concat(later);
    return [primary, pick(pool)];
};
