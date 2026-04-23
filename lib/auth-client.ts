/**
 * Client-Side Authentication Utilities
 *
 * Manages JWT token lifecycle for Admin/Trainer sessions.
 * Tokens are stored in BOTH localStorage (client access) and
 * a cookie (server-side access via Next.js middleware/layouts).
 *
 * Employee tokens (emp_*) are NOT handled here — they use
 * the Flutter mobile app's own auth flow.
 */

// ─── Token Storage ────────────────────────────────────────────────────────

const TOKEN_KEY = 'token';

/** Store token in both localStorage and cookie */
export function setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

/** Retrieve token from localStorage */
export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

/** Remove token from both localStorage and cookie */
export function removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

// ─── JWT Decoding (no verification — client-side only) ────────────────────

interface JwtPayload {
    userId: string;
    role: 'Admin' | 'Trainer' | 'Employee';
    iat: number;
    exp: number;
}

/**
 * Decode JWT payload without verification.
 * Returns null if the token is malformed or missing.
 */
export function decodeToken(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload as JwtPayload;
    } catch {
        return null;
    }
}

/** Check if a decoded token is expired */
function isTokenExpired(payload: JwtPayload): boolean {
    if (!payload.exp) return false;
    // exp is in seconds, Date.now() in ms
    return Date.now() >= payload.exp * 1000;
}

/**
 * Get the current user info from the stored token.
 * Returns null if no token, malformed, or expired.
 */
export function getUserFromToken(): JwtPayload | null {
    const token = getToken();
    if (!token) return null;

    const payload = decodeToken(token);
    if (!payload) return null;

    if (isTokenExpired(payload)) {
        removeToken();
        return null;
    }

    return payload;
}

/** Check if user is authenticated with a valid, non-expired token */
export function isAuthenticated(): boolean {
    return getUserFromToken() !== null;
}

/** Clear token and redirect to login */
export function logout(): void {
    removeToken();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}

// ─── Fetch Helper ─────────────────────────────────────────────────────────

/**
 * Wrapper around fetch() that automatically attaches the JWT
 * Authorization header. If the token is expired, triggers logout.
 */
export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getToken();

    // Check token validity before making the request
    if (token) {
        const payload = decodeToken(token);
        if (!payload || isTokenExpired(payload)) {
            logout();
            throw new Error('Session expired');
        }
    }

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, { ...options, headers });

    // If server returns 401, token may have been invalidated server-side
    if (response.status === 401) {
        logout();
        throw new Error('Session expired');
    }

    return response;
}
