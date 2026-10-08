import {useEffect, useRef, useState} from "react";
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from "@/pages/login/LoginPage"
import GuestRouter from "@/router/GuestRouter.tsx"
import DashboardPage from "@/pages/dashboard/DashboardPage.tsx"
import Header from "@/components/layout/Header.tsx"
import Footer from "@/components/layout/Footer.tsx"
import AdminPage from "@/pages/admin/AdminPage.tsx";
import ChatPage from "@/pages/chat/ChatPage.tsx";
import ExplorePage from "@/pages/explore/ExplorePage.tsx";
import IdeasPage from "@/pages/ideas/IdeasPage.tsx";
import ProfilePage from "@/pages/profile/ProfilePage.tsx";
import StatsPage from "@/pages/stats/StatsPage.tsx";
import ProtectedRoute from "@/router/ProtectedRoute.tsx";
import Exmatriculation from "@/pages/exmatriculation-simulator/Exmatriculation.tsx";
import CaffeineCalculatorPage from "@/pages/caffeine-calculator/CaffeineCalculatorPage.tsx";
import PresentationGameLobbyPage from "@/pages/presentation-game/PresentationGameLobbyPage.tsx";
import PresentationGameRoomPage from "@/pages/presentation-game/PresentationGameRoomPage.tsx";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy.tsx";
import Imprint from "@/pages/legal/Imprint.tsx";
import ReleaseNotesPage from "@/pages/release-notes/ReleaseNotesPage.tsx";
import MaintananceInfoPage from "@/pages/maintenance/MaintananceInfoPage.tsx";
import MemeWallPage from "@/pages/memewall/MemeWallPage.tsx";
import RoomfinderPage from "@/pages/roomfinder/RoomfinderPage.tsx";
import CalendarPage from "@/pages/calendar/CalendarPage.tsx";
import {getUserRole, hasSessionMeta} from "@/services/tokenService.tsx";
import {touchGuest} from "@/services/guestService.tsx";
import {authService} from "@/services/authService.tsx";
import {fetchProfileSettings, getUsername} from "@/services/userService.tsx";
import {websocketService} from "@/services/websocketService.tsx";
import {websocketChannels} from "@/services/websocketChannels.ts";
import {WebSocketMessageType} from "@/models/WebSocketEnvelope.tsx";
import type {ChatMessage} from "@/models/ChatMessage.tsx";

function useCourseChat(pathname: string): number {
    const [unread, setUnread] = useState(0);
    const [course, setCourse] = useState<string | null>(null);
    const onChatRef = useRef(pathname === "/chat");
    onChatRef.current = pathname === "/chat";
    const isGuest = getUserRole() === "GUEST";

    useEffect(() => {
        if (pathname === "/chat") {
            setUnread(0);
        }
    }, [pathname]);

    useEffect(() => {
        if (isGuest) {
            setCourse(null);
            return;
        }

        let cancelled = false;
        fetchProfileSettings()
            .then(profile => {
                if (!cancelled) {
                    setCourse(profile.course?.trim() || null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCourse(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isGuest, pathname]);

    useEffect(() => {
        if (isGuest || !course) {
            return;
        }

        const channel = websocketChannels.courseChat(course);
        websocketService.connect();
        websocketService.joinChannel(channel);

        const unsubscribe = websocketService.subscribe(envelope => {
            const incomingCourse = (envelope.payload as {course?: string} | null)?.course?.trim();
            if (envelope.channel !== channel && incomingCourse !== course) {
                return;
            }
            if (envelope.type === WebSocketMessageType.CHAT_CLEARED) {
                setUnread(0);
                return;
            }
            if (envelope.type !== WebSocketMessageType.MESSAGE || onChatRef.current) {
                return;
            }
            const incoming = envelope.payload as ChatMessage;
            if (!incoming?.id || incoming.authorUsername === getUsername()) {
                return;
            }
            setUnread(count => count + 1);
        });

        return () => {
            unsubscribe();
            websocketService.leaveChannel(channel);
        };
    }, [isGuest, course]);

    return unread;
}

const HIDDEN_HEADER_ROUTES = ['/login', '/calendar']
const HIDDEN_FOOTER_ROUTES = ['/login', '/chat', '/presentation-game', '/calendar']
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

const Layout = () => {
    const { pathname } = useLocation()
    const showHeader = !HIDDEN_HEADER_ROUTES.includes(pathname) && !pathname.startsWith("/calendar/")
    const unreadChat = useCourseChat(pathname);
    const showFooter = !HIDDEN_FOOTER_ROUTES.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    useEffect(() => {
        const ping = () => {
            if (localStorage.getItem("guest") !== "true" || hasSessionMeta()) {
                return;
            }
            void touchGuest();
        };
        ping();
        const timer = window.setInterval(ping, 60_000);
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                ping();
            }
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [pathname]);

    useEffect(() => {
        const renew = () => {
            if (document.visibilityState !== "visible" || !hasSessionMeta()) {
                return;
            }
            void authService.touch();
        };
        const timer = window.setInterval(renew, 5 * 60 * 1000);
        document.addEventListener("visibilitychange", renew);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", renew);
        };
    }, []);

    if (MAINTENANCE_MODE === true) return <MaintananceInfoPage />

    return (
        <div className="app-shell">
            {showHeader && <Header unreadChat={unreadChat} />}
            <main className="app-main">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin> <AdminPage /> </ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute> <ChatPage /> </ProtectedRoute>} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/ideas" element={<IdeasPage />} />
                    <Route path="/account" element={<ProtectedRoute> <ProfilePage /> </ProtectedRoute>} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/exmatriculation" element={<Exmatriculation />} />
                    <Route path="/caffeine-calculator" element={<CaffeineCalculatorPage />} />
                    <Route path="/presentation-game" element={<ProtectedRoute> <PresentationGameLobbyPage /> </ProtectedRoute>} />
                    <Route path="/presentation-game/:code" element={<ProtectedRoute> <PresentationGameRoomPage /> </ProtectedRoute>} />
                    <Route path="/memewall" element={<ProtectedRoute> <MemeWallPage /> </ProtectedRoute>} />
                    <Route path="/roomfinder" element={<RoomfinderPage />} />
                    <Route path="/imprint" element={<Imprint />} />
                    <Route path="/privacypolicy" element={<PrivacyPolicy />} />
                    <Route path="/release-notes" element={<ReleaseNotesPage />} />
                    <Route
                        path="/"
                        element={
                            <GuestRouter>
                                <DashboardPage />
                            </GuestRouter>
                        }
                    />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            {showFooter && <Footer />}
        </div>
    )
}

export default Layout;
