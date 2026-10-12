import type {ChatMessage} from "@/models/ChatMessage.tsx";
import {WebSocketMessageType} from "@/models/WebSocketEnvelope.tsx";
import {chatService} from "@/services/chatService.tsx";
import {getUsername} from "@/services/userService.tsx";
import {websocketChannels} from "@/services/websocketChannels.ts";
import {websocketService} from "@/services/websocketService.tsx";

type Listener = () => void;

const listeners = new Set<Listener>();
const unreadIds = new Set<string>();

let snapshot = 0;
let activeCourse: string | null = null;
let viewingChat = false;
let previousOnChat = false;
let heldChannel: string | null = null;
let leftAt: number | null = null;
let pollTimer: number | null = null;
let pullToken = 0;
let reconnectAttempted = false;
let listening = false;

function emit() {
    const next = unreadIds.size;
    if (next === snapshot) {
        return;
    }
    snapshot = next;
    listeners.forEach(listener => listener());
}

function clearUnread() {
    unreadIds.clear();
    emit();
}

function isOwnMessage(message: ChatMessage): boolean {
    const author = message.authorUsername?.trim() ?? "";
    const mine = getUsername().trim();
    return author !== "" && mine !== "" && author === mine;
}

function remember(message: ChatMessage | null | undefined) {
    if (viewingChat || !activeCourse || !message?.id || message.id.startsWith("pending-") || isOwnMessage(message)) {
        return;
    }
    const messageCourse = message.course?.trim();
    if (messageCourse && messageCourse !== activeCourse) {
        return;
    }
    unreadIds.add(message.id);
    emit();
}

function toMillis(value: string | number | null | undefined): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value < 1e12 ? value * 1000 : value;
    }
    if (typeof value !== "string" || value.trim() === "") {
        return 0;
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
        return numeric < 1e12 ? numeric * 1000 : numeric;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function ensureListening() {
    if (listening) {
        return;
    }
    listening = true;
    websocketService.subscribe(envelope => {
        if (envelope.type === WebSocketMessageType.ERROR) {
            const code = (envelope.payload as {code?: string} | null)?.code;
            if ((code === "NO_COURSE_SET" || code === "COURSE_MISMATCH") && !reconnectAttempted) {
                reconnectAttempted = true;
                websocketService.reconnect();
            }
            return;
        }
        if (!activeCourse) {
            return;
        }
        const channel = websocketChannels.courseChat(activeCourse);
        const incomingCourse = (envelope.payload as {course?: string} | null)?.course?.trim();
        if (envelope.channel !== channel && incomingCourse !== activeCourse) {
            return;
        }
        if (envelope.type === WebSocketMessageType.CHAT_CLEARED) {
            leftAt = Date.now();
            clearUnread();
            return;
        }
        if (envelope.type !== WebSocketMessageType.MESSAGE || viewingChat) {
            return;
        }
        remember(envelope.payload as ChatMessage);
    });
}

async function pull() {
    if (viewingChat || !activeCourse || leftAt == null) {
        return;
    }
    const token = ++pullToken;
    const course = activeCourse;
    const since = leftAt;
    try {
        const messages = await chatService.getMessages({limit: 50});
        if (token !== pullToken || viewingChat || activeCourse !== course || leftAt !== since) {
            return;
        }
        let changed = false;
        for (const message of messages) {
            if (!message.id || message.id.startsWith("pending-") || isOwnMessage(message)) {
                continue;
            }
            if (message.course?.trim() && message.course.trim() !== course) {
                continue;
            }
            if (toMillis(message.createdAt) <= since) {
                continue;
            }
            if (unreadIds.has(message.id)) {
                continue;
            }
            unreadIds.add(message.id);
            changed = true;
        }
        if (changed) {
            emit();
        }
    } catch {
        // Keep the last badge if this refresh fails.
    }
}

function ensurePoll() {
    if (pollTimer != null) {
        return;
    }
    void pull();
    pollTimer = window.setInterval(() => void pull(), 4000);
}

function stopPoll() {
    pullToken += 1;
    if (pollTimer != null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
    }
}

function holdCourse(course: string | null) {
    const channel = course ? websocketChannels.courseChat(course) : null;
    if (heldChannel && heldChannel !== channel) {
        websocketService.releaseJoined(heldChannel);
        heldChannel = null;
    }
    if (!channel) {
        return;
    }
    websocketService.connect();
    websocketService.ensureJoined(channel);
    heldChannel = channel;
}

export const chatUnread = {
    syncView(course: string | null, onChat: boolean, guest = false) {
        viewingChat = guest ? false : onChat;
        if (guest) {
            activeCourse = null;
            return;
        }
        if (course) {
            activeCourse = course;
        }
    },

    noteCourse(course: string | null) {
        const next = course?.trim() || null;
        if (!next) {
            return;
        }
        ensureListening();
        activeCourse = next;
        holdCourse(next);
    },

    watch(course: string | null, onChat: boolean, reset = false) {
        ensureListening();
        if (reset) {
            activeCourse = null;
            viewingChat = false;
            previousOnChat = false;
            stopPoll();
            leftAt = null;
            clearUnread();
            holdCourse(null);
            return;
        }
        const resolved = course?.trim() || activeCourse;
        activeCourse = resolved;
        viewingChat = onChat;
        const enteredChat = onChat && !previousOnChat;
        const leftChat = !onChat && previousOnChat;
        previousOnChat = onChat;

        if (!resolved || enteredChat) {
            stopPoll();
            leftAt = null;
            clearUnread();
        }

        holdCourse(resolved);

        if (!resolved || onChat) {
            return;
        }

        if (leftChat || leftAt == null) {
            leftAt = Date.now();
        }
        ensurePoll();
    },

    subscribe(listener: Listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    getSnapshot() {
        return snapshot;
    },
};
