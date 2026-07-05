export interface AuthLoginToken {
    token: string;
    refresh: string;
}

export interface AccessTokenPayload {
    user: string,
    phone: string,
    id: number,
}
