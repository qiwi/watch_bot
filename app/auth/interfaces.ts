export interface IAuth {
    isAuthenticated(id: string): boolean;
    authenticate(id: string): void;
}