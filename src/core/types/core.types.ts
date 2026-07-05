export interface ApiReturn<T> {
    error: boolean;
    body: T;
}