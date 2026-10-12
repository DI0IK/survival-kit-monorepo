export function formatStatNumber(value: number): string {
    if (!Number.isFinite(value)) {
        return "0";
    }
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    if (Number.isInteger(rounded)) {
        return rounded.toLocaleString("de-DE", {maximumFractionDigits: 0});
    }
    return rounded.toLocaleString("de-DE", {minimumFractionDigits: 2, maximumFractionDigits: 2});
}
