import {useId} from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import "@/components/stats/ActionChart.css";
import type {CaffeineEntry} from "@/models/CaffeineEntry.tsx";
import {berlinDayKey, recentBerlinDays} from "@/components/stats/berlinDays.ts";
import {formatStatNumber} from "@/components/stats/formatStatNumber.ts";

type DailyMg = {
    date: string;
    label: string;
    mg: number;
    users: Set<string>;
};

const groupCaffeineByDay = (entries: CaffeineEntry[]): DailyMg[] => {
    const buckets = new Map<string, DailyMg>();
    recentBerlinDays(7).forEach(day => {
        buckets.set(day.date, {date: day.date, label: day.label, mg: 0, users: new Set()});
    });

    entries.forEach((entry) => {
        const bucket = buckets.get(berlinDayKey(new Date(entry.consumedAt)));
        if (!bucket) return;
        bucket.mg += entry.amountMg;
        bucket.users.add(entry.userId);
    });

    return Array.from(buckets.values());
};

export type CaffeineChartMode = "sum" | "daily-average" | "per-person";

const headlineFor = (buckets: DailyMg[], mode: CaffeineChartMode): string => {
    const totalMg = buckets.reduce((sum, day) => sum + day.mg, 0);
    if (mode === "sum") {
        return `Koffein-Summe (${formatStatNumber(totalMg)} mg in den letzten 7 Tagen)`;
    }
    if (mode === "daily-average") {
        return `Durchschnittliche Tagesdosis (Ø ${formatStatNumber(totalMg / 7)} mg über die letzten 7 Tage)`;
    }
    const users = new Set(buckets.flatMap(day => [...day.users]));
    const perPerson = users.size === 0 ? 0 : totalMg / users.size;
    return `Koffein pro Person (Ø ${formatStatNumber(perPerson)} mg in den letzten 7 Tagen)`;
};

const chartPoints = (buckets: DailyMg[], mode: CaffeineChartMode) =>
    buckets.map(bucket => ({
        ...bucket,
        mg: mode === "per-person" && bucket.users.size > 0 ? bucket.mg / bucket.users.size : bucket.mg,
    }));

type CaffeineDailyChartProps = {
    entries: CaffeineEntry[];
    mode: CaffeineChartMode;
};

const CaffeineDailyChart = ({ entries, mode }: CaffeineDailyChartProps) => {
    const gradientId = useId().replace(/:/g, "");
    const buckets = groupCaffeineByDay(entries);
    const data = chartPoints(buckets, mode);
    const title = headlineFor(buckets, mode);
    const seriesLabel = mode === "per-person" ? "pro Person" : "Koffein";

    return (
        <div className="action-chart">
            <h4 className="action-chart__title">{title}</h4>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary-accent)" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="var(--color-primary-accent)" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis
                        dataKey="label"
                        interval={0}
                        tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                        axisLine={{ stroke: "var(--color-border)" }}
                        tickLine={{ stroke: "var(--color-border)" }}
                    />
                    <YAxis
                        allowDecimals
                        width={48}
                        tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                        axisLine={{ stroke: "var(--color-border)" }}
                        tickLine={{ stroke: "var(--color-border)" }}
                        tickFormatter={(value) => formatStatNumber(Number(value))}
                        unit="mg"
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "var(--color-background-primary)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "0.5rem",
                            boxShadow: "0 2px 8px var(--color-shadow)",
                            color: "var(--color-text-primary)",
                        }}
                        formatter={(value) => [`${formatStatNumber(Number(value))} mg`, seriesLabel] as [string, string]}
                    />
                    <Area
                        type="monotone"
                        dataKey="mg"
                        stroke="var(--color-primary-accent)"
                        fill={`url(#${gradientId})`}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CaffeineDailyChart;
