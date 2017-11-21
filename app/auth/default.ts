import {IAuth} from './interfaces';

export default class Auth implements IAuth {
    protected _authenticated: Set<string> = new Set<string>();

    public isAuthenticated(id: string): boolean {
        return this._authenticated.has(id);
    }
    public authenticate(id: string): void {
        this._authenticated.add(id);
    }
}