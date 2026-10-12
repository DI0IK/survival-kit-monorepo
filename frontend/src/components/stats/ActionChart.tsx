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
import type {TrackAction} from "@/models/TrackAction.tsx";
import {berlinDayKey, recentBerlinDays} from "@/components/stats/berlinDays.ts";
import {formatStatNumber} from "@/components/stats/formatStatNumber.ts";

type DailyCount = {
    date: string;
    label: string;
    count: number;
};

const groupActionsByDay = (actions: TrackAction[]): DailyCount[] => {
    const buckets = new Map<string, DailyCount>();
    recentBerlinDays(7).forEach(day => {
        buckets.set(day.date, {date: day.date, label: day.label, count: 0});
    });

    actions.forEach((action) => {
        const bucket = buckets.get(berlinDayKey(new Date(action.timestamp)));
        if (bucket) {
            bucket.count += 1;
        }
    });

    return Array.from(buckets.values());
};

type ActionChartProps = {
    actions: TrackAction[];
    label: string;
};

const ActionChart = ({ actions, label }: ActionChartProps) => {
    const gradientId = useId().replace(/:/g, "");
    const data = groupActionsByDay(actions);
    const total = data.reduce((sum, day) => sum + day.count, 0);
    const title = `${label} (${formatStatNumber(total)} in den letzten 7 Tagen)`;

    return (
        <div className="action-chart">
            <h4 className="action-chart__title">{title}</h4>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor="var(--color-primary-accent)"
                                stopOpacity={0.5}
                            />
                            <stop
                                offset="95%"
                                stopColor="var(--color-primary-accent)"
                                stopOpacity={0.05}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--color-border)"
                    />
                    <XAxis
                        dataKey="label"
                        interval={0}
                        tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                        axisLine={{ stroke: "var(--color-border)" }}
                        tickLine={{ stroke: "var(--color-border)" }}
                    />
                    <YAxis
                        allowDecimals={false}
                        width={30}
                        tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                        axisLine={{ stroke: "var(--color-border)" }}
                        tickLine={{ stroke: "var(--color-border)" }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "var(--color-background-primary)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "0.5rem",
                            boxShadow: "0 2px 8px var(--color-shadow)",
                            color: "var(--color-text-primary)",
                        }}
                        labelStyle={{ color: "var(--color-text-primary)" }}
                        itemStyle={{ color: "var(--color-primary-accent)" }}
                        formatter={(value) => [formatStatNumber(Number(value)), "Anzahl"] as [string, string]}
                        labelFormatter={(label) => `${label}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-primary-accent)"
                        fill={`url(#${gradientId})`}
                        strokeWidth={2}
                        activeDot={{
                            r: 5,
                            fill: "var(--color-primary-accent)",
                            stroke: "var(--color-background-primary)",
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActionChart;