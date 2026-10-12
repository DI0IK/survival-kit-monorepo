import {api, apiFetch, checkResponse} from "@/services/api.tsx";
import type {TrackAction, TrackActionType} from "@/models/TrackAction.tsx";
import type {Page} from "@/models/Page.tsx";

const API_URL = api.baseUrl;

export const trackActivity = async (action: TrackActionType): Promise<void> => {
    const response = await apiFetch(`${API_URL}/track/action?action=${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    await checkResponse(response);
}

export const getUserActions = async (
    action: TrackActionType,
    continuation?: string
): Promise<Page<TrackAction>> => {
    const params = new URLSearchParams({ action, ...(continuation !== undefined && { continuation }) });

    const response = await apiFetch(`${API_URL}/stats/userActions?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    await checkResponse(response);

    return response.json();
};

export const getCourseActions = async (
    action: TrackActionType,
    continuation?: string
): Promise<Page<TrackAction>> => {
    const params = new URLSearchParams({ action, ...(continuation !== undefined && { continuation }) });

    const response = await apiFetch(`${API_URL}/stats/courseActions?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    await checkResponse(response);

    return response.json();
};

export const getGlobalActions = async (
    action: TrackActionType,
    continuation?: string
): Promise<Page<TrackAction>> => {
    const params = new URLSearchParams({ action, ...(continuation !== undefined && { continuation }) });

    const response = await apiFetch(`${API_URL}/stats/globalActions?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    await checkResponse(response);

    return response.json();
};

export const getUserActionSum = async (
    action: TrackActionType
): Promise<number> => {
    const params = new URLSearchParams({ action });

    const response = await apiFetch(`${API_URL}/stats/userActionSum?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    await checkResponse(response);

    return response.json();
};

export const getCourseActionSum = async (
    action: TrackActionType
): Promise<number> => {
    const params = new URLSearchParams({ action });

    const response = await apiFetch(`${API_URL}/stats/courseActionSum?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    await checkResponse(response);

    return response.json();
};

export const getGlobalActionSum = async (
    action: TrackActionType
): Promise<number> => {
    const params = new URLSearchParams({ action });

    const response = await apiFetch(`${API_URL}/stats/globalActionSum?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    await checkResponse(response);

    return response.json();
};
