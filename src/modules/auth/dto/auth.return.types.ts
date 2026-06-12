export interface AuthLoginToken {
    token: string;
    refresh: string;
}

export interface AccessTokenPayload {
    user: string,
    phone: string,
    id: number,
}

export interface ApiReturn<T> {
    error: boolean;
    body: T;
}