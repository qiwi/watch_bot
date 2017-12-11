import {IAuth} from './interfaces';
import * as config from 'config';
import * as util from 'util';
import {FSBackuper} from '../backuper/fsbackuper';
import {IBackuper} from '../backuper/interfaces';

export default class Auth implements IAuth {
    constructor(
        protected _authenticated: Set<string> = new Set<string>(),
        protected readonly _allowedChats = config.botAuth.allowedChats,
        protected readonly _botAuthToken: string = config.get('botAuth.token'),
        protected _backuper: IBackuper = new FSBackuper()
    ) {}

    public getAuthenticatedChats(): Readonly<Set<string>> {
        return this._authenticated;
    }

    public isAuthenticated(chatId: string): boolean {
        return this._authenticated.has(chatId);
    }

    public authenticate(chatId: string, keyword: string): boolean {
        if (keyword === this._botAuthToken) {

            if (util.isArray(this._allowedChats)) {
                if (this._allowedChats.indexOf(chatId) > -1) {
                    this._authenticated.add(chatId);

                    this._backuper.backupAuthData(this._authenticated);

                    return true;
                }

                return false;
            }

            this._authenticated.add(chatId);

            this._backuper.backupAuthData(this._authenticated);

            return true;
        }

        return false;
    }
}