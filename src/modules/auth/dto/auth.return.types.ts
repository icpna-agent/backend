export interface AuthLoginToken {
    token: string;
}

export interface ApiReturn<T> {
    error: boolean;
    body: T;
}