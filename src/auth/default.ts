import {IAuth} from './interfaces';

export default class Auth implements IAuth {
    private authenticated: Set<string> = new Set<string>();

    public isAuthenticated(id: string): boolean {
        return this.authenticated.has(id);
    }
    public authenticate(id: string): void {
        this.authenticated.add(id);
    }
}