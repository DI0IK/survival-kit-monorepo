import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Bell} from "lucide-react";
import {getAnsweredFeedback, type AnsweredFeedback} from "@/services/feedbackService.tsx";
import {getUsername} from "@/services/userService.tsx";
import {websocketService} from "@/services/websocketService.tsx";
import {WebSocketMessageType} from "@/models/WebSocketEnvelope.tsx";
import "@/components/layout/Notifications.css";

const SEEN_FOR_MS = 24 * 60 * 60 * 1000;

type SeenMap = Record<string, number>;

const storageKey = () => `lsk-notifications-seen:${getUsername() || "user"}`;

const readSeen = (): SeenMap => {
    try {
        const raw = localStorage.getItem(storageKey());
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw) as SeenMap;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const writeSeen = (seen: SeenMap) => {
    localStorage.setItem(storageKey(), JSON.stringify(seen));
};

const markSeen = (seen: SeenMap, ids: string[]): SeenMap => {
    const now = Date.now();
    let next = seen;
    for (const id of ids) {
        if (next[id] != null) {
            continue;
        }
        if (next === seen) {
            next = {...seen};
        }
        next[id] = now;
    }
    if (next !== seen) {
        writeSeen(next);
    }
    return next;
};

const isVisible = (item: AnsweredFeedback, seen: SeenMap, now: number) => {
    const seenAt = seen[item.id];
    if (seenAt == null) {
        return true;
    }
    return now - seenAt < SEEN_FOR_MS;
};

const Notifications = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<AnsweredFeedback[]>([]);
    const [seen, setSeen] = useState<SeenMap>(() => readSeen());
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            getAnsweredFeedback()
                .then(next => {
                    if (!cancelled) {
                        setItems(next);
                    }
                })
                .catch(() => {
                    // Keep the current list when a refresh fails.
                });
        };

        load();
        const timer = window.setInterval(load, 20000);
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                load();
            }
        };
        document.addEventListener("visibilitychange", onVisible);
        websocketService.connect();
        const unsubscribe = websocketService.subscribe(envelope => {
            if (envelope.type === WebSocketMessageType.ACTIVITY) {
                load();
            }
        });

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }
        setSeen(current => markSeen(current, items.map(item => item.id)));
    }, [open, items]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const now = Date.now();
    const visible = items.filter(item => isVisible(item, seen, now));
    const unseenCount = visible.filter(item => seen[item.id] == null).length;

    const openItem = (id: string) => {
        setOpen(false);
        navigate(`/ideas?feedback=${encodeURIComponent(id)}`);
    };

    return (
        <div className="notifications" ref={rootRef}>
            <button
                type="button"
                className={`notifications-button${open ? " notifications-button--open" : ""}`}
                aria-label="Benachrichtigungen"
                aria-expanded={open}
                onClick={() => setOpen(current => !current)}
            >
                <Bell size={20} />
                {unseenCount > 0 && (
                    <span className="notifications-badge">{unseenCount > 9 ? "9+" : unseenCount}</span>
                )}
            </button>
            {open && (
                <div className="notifications-overlay" role="dialog" aria-label="Aktivitäten">
                    <h2>Aktivitäten</h2>
                    {visible.length > 0 ? (
                        <ul className="notifications-list">
                            {visible.map(item => (
                                <li key={item.id}>
                                    <button type="button" onClick={() => openItem(item.id)}>
                                        Dein Feedback-Beitrag &apos;{item.title}&apos; wurde von einem Admin beantwortet.
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="notifications-empty">Keine Aktivitäten.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;
