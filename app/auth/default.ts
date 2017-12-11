import {IAuth} from './interfaces';
import * as config from 'config';
import * as util from 'util';

export default class Auth implements IAuth {
    protected _authenticated: Set<string> = new Set<string>();

    constructor(
        protected readonly _allowedChats = config.botAuth.allowedChats,
        protected readonly _botAuthToken: string = config.get('botAuth.token')
    ) {}

    public isAuthenticated(chatId: string): boolean {
        return this._authenticated.has(chatId);
    }

    public authenticate(chatId: string, keyword: string): boolean {
        if (keyword === this._botAuthToken) {

            if (util.isArray(this._allowedChats)) {
                if (this._allowedChats.indexOf(chatId) > -1) {
                    this._authenticated.add(chatId);
                    return true;
                }

                return false;
            }

            this._authenticated.add(chatId);
            return true;
        }

        return false;
    }
}