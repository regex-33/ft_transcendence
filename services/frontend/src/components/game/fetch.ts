import { formatDiagnosticsWithColorAndContext } from "typescript";

const BASE_URL = `${import.meta.env.VITE_GAME_SERVICE_HOST}:${import.meta.env.VITE_GAME_SERVICE_PORT}/api`;


export const fetchGameApi = async (endpoint: string, method: 'POST' | 'GET' | 'DELETE', data: Record<string, unknown> | null = null) =>
{
    if (!endpoint.startsWith('/'))
        endpoint = '/' + endpoint;
    let headers = {};
    if (data)
        headers = {
            'Content-Type': 'application/json'
        };
    const response = await fetch(BASE_URL + endpoint, {
        method,
        headers,
        credentials: 'include',
        ...(data ? {body: JSON.stringify(data)} : {})
    });
    const responseData = await response.json();
    if (!response.ok)
        throw new Error(responseData.error)
    return responseData;
}