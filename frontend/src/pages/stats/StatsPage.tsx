import "@/pages/stats/StatsPage.css";
import SectionHeading from "@/components/ui/SectionHeading.tsx";
import {getUserRole} from "@/services/tokenService.tsx";
import { useEffect, useState } from "react";
import type {TrackAction, TrackActionType} from "@/models/TrackAction.tsx";
import type {Page} from "@/models/Page.tsx";
import {
    getCourseActions,
    getGlobalActions,
    getUserActions,
} from "@/services/statisticsService.tsx";
import ActionChart from "@/components/stats/ActionChart.tsx";
import CaffeineDailyChart from "@/components/caffeine/CaffeineDailyChart.tsx";
import FilterDropdown from "@/components/ui/FilterDropdown.tsx";
import type {CaffeineEntry} from "@/models/CaffeineEntry.tsx";
import {
    getCourseCaffeineEntries,
    getGlobalCaffeineEntries,
    getUserCaffeineEntries,
} from "@/services/caffeineService.tsx";

type CaffeineStat = "CAFFEINE_SUM" | "CAFFEINE_AVG";
type VisibleAction = Exclude<TrackActionType, "LOGGED_IN">;
type StatsFilter = VisibleAction | CaffeineStat;

const ALL_ACTIONS: VisibleAction[] = [
    "EXMATRICULATED",
    "GAME_PLAYED",
    "GAME_SUGGESTED",
    "IDEA_SUBMITTED",
    "MEME_UPLOADED",
    "PRESENTATION_GAME_PLAYED",
    "ROOMS_SEARCHED",
];

const ALL_FILTERS: StatsFilter[] = [...ALL_ACTIONS, "CAFFEINE_SUM", "CAFFEINE_AVG"];

const translateFilter = (filter: StatsFilter) => {
    switch (filter) {
        case "EXMATRICULATED": return "Simulierte Exmatrikulationen"
        case "GAME_PLAYED": return "Browserspiele geöffnet"
        case "GAME_SUGGESTED": return "Spielvorschläge"
        case "IDEA_SUBMITTED": return "Feedback abgegeben"
        case "MEME_UPLOADED": return "Memes hochgeladen"
        case "PRESENTATION_GAME_PLAYED": return "Präsi-Spiel-Teilnahmen"
        case "ROOMS_SEARCHED": return "Raumsuchen"
        case "CAFFEINE_SUM": return "Koffein-Summe"
        case "CAFFEINE_AVG": return "Koffein-Durchschnitt"
    }
}

const translateFilterReverse = (label: string): StatsFilter | undefined => {
    return ALL_FILTERS.find((filter) => translateFilter(filter) === label);
};

const StatsPage = () => {
    const [userActions, setUserActions] = useState<TrackAction[]>([]);
    const [courseActions, setCourseActions] = useState<TrackAction[]>([]);
    const [globalActions, setGlobalActions] = useState<TrackAction[]>([]);

    const [userCaffeine, setUserCaffeine] = useState<CaffeineEntry[]>([]);
    const [courseCaffeine, setCourseCaffeine] = useState<CaffeineEntry[]>([]);
    const [globalCaffeine, setGlobalCaffeine] = useState<CaffeineEntry[]>([]);

    const [selectedFilter, setSelectedFilter] = useState<StatsFilter[]>([...ALL_FILTERS]);

    useEffect(() => {
        const fetchAllPages = async (
            fetcher: (action: TrackActionType, continuation?: string) => Promise<Page<TrackAction>>,
            action: TrackActionType
        ): Promise<TrackAction[]> => {
            let continuation: string | undefined = undefined;
            let result: TrackAction[] = [];

            do {
                const page: Page<TrackAction> = await fetcher(action, continuation);
                result = [...result, ...page.data];
                continuation = page.continuation ?? undefined;
            } while (continuation);

            return result;
        };

        const fetchUserActions = async () => {
            const results = await Promise.all(
                ALL_ACTIONS.map((action) => fetchAllPages(getUserActions, action))
            );
            setUserActions(results.flat());
        };

        const fetchCourseActions = async () => {
            const results = await Promise.all(
                ALL_ACTIONS.map((action) => fetchAllPages(getCourseActions, action))
            );
            setCourseActions(results.flat());
        };

        const fetchGlobalActions = async () => {
            const results = await Promise.all(
                ALL_ACTIONS.map((action) => fetchAllPages(getGlobalActions, action))
            );
            setGlobalActions(results.flat());
        };

        const fetchCaffeine = async () => {
            if (getUserRole() !== "GUEST") {
                setUserCaffeine(await getUserCaffeineEntries());
                setCourseCaffeine(await getCourseCaffeineEntries());
            }
            setGlobalCaffeine(await getGlobalCaffeineEntries());
        };

        if (getUserRole() !== "GUEST") fetchUserActions();
        if (getUserRole() !== "GUEST") fetchCourseActions();
        fetchGlobalActions();
        fetchCaffeine();
    }, []);

    const onFilterChange = (items: string[]) => {
        const filters = items
            .map((label) => translateFilterReverse(label))
            .filter((filter): filter is StatsFilter => filter !== undefined);

        setSelectedFilter(filters);
    };

    const showAction = (action: VisibleAction) => selectedFilter.includes(action);

    const actionCharts = (actions: TrackAction[]) =>
        ALL_ACTIONS.filter(showAction).map(action => (
            <ActionChart
                key={action}
                actions={actions.filter(item => item.type === action)}
                label={translateFilter(action)}
            />
        ));

    const showCaffeineSum = selectedFilter.includes("CAFFEINE_SUM");
    const showCaffeineAvg = selectedFilter.includes("CAFFEINE_AVG");

    const caffeineCharts = (entries: CaffeineEntry[], perPerson: boolean) => (
        <>
            {showCaffeineSum && <CaffeineDailyChart key="sum" entries={entries} mode="sum" />}
            {showCaffeineAvg && (
                <CaffeineDailyChart
                    key="avg"
                    entries={entries}
                    mode={perPerson ? "per-person" : "daily-average"}
                />
            )}
        </>
    );

    return <div className="survival-kit-page">
        <div className="stats-page">
            <div className="stats-page-header">
                <FilterDropdown
                    values={ALL_FILTERS.map(translateFilter)}
                    selectedItems={selectedFilter.map(translateFilter)}
                    returnSelected={false}
                    onChange={onFilterChange}
                    placeholder="Statistiken filtern"
                />
            </div>
            { getUserRole() !== "GUEST" && <SectionHeading heading={"Persönliche Statistiken"} subheading={"Statistiken deines persönlichen Profils"} centered={false} /> }
            <div className="stats-page-action-charts">
                {getUserRole() !== "GUEST" && actionCharts(userActions)}
                {getUserRole() !== "GUEST" && caffeineCharts(userCaffeine, false)}
            </div>
            { getUserRole() !== "GUEST" && selectedFilter.length === 0 && <div className="stats-page-no-filter-info">Keine Statistiken, die deinem Filter entsprechen.</div> }

            { getUserRole() !== "GUEST" && selectedFilter.length > 0 && <SectionHeading heading={"Kurs-Statistiken"} subheading={"Statistiken deines Kurses"} centered={false} /> }
            <div className="stats-page-action-charts">
                {getUserRole() !== "GUEST" && actionCharts(courseActions)}
                {getUserRole() !== "GUEST" && caffeineCharts(courseCaffeine, true)}
            </div>

            <SectionHeading heading={"Globale Statistiken"} subheading={"Statistiken aller Benutzer des Survival Kits"} centered={false} />
            <div className="stats-page-action-charts">
                {actionCharts(globalActions)}
                {caffeineCharts(globalCaffeine, true)}
            </div>
            { selectedFilter.length === 0 && <div className="stats-page-no-filter-info">Keine Statistiken, die deinem Filter entsprechen.</div> }
            { getUserRole() === "GUEST" && <div className="stats-page-no-filter-info">Melde dich an, um deine persönlichen Statistiken zu sehen.</div> }
        </div>
    </div>
}

export default StatsPage;
