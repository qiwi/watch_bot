import {IAuth} from './interfaces';
import * as config from 'config';
import * as util from 'util';
import {FSBackuper} from '../backuper/fsbackuper';
import {IBackuper} from '../backuper/interfaces';

export default class Auth implements IAuth {
    constructor(
        protected _authenticatedChats: Set<string> = new Set<string>(),
        protected readonly _allowedChats = config.botAuth.allowedChats,
        protected readonly _botAuthToken: string = config.get('botAuth.token'),
        protected _backuper: IBackuper = new FSBackuper()
    ) {}

    public isAuthenticated(chatId: string): boolean {
        return this._authenticatedChats.has(chatId);
    }

    public authenticate(chatId: string, keyword: string): boolean {
        if (keyword === this._botAuthToken) {

            if (util.isArray(this._allowedChats)) {
                if (this._allowedChats.indexOf(chatId) > -1) {
                    this._authenticatedChats.add(chatId);

                    this._backuper.backupAuthData(this._authenticatedChats);

                    return true;
                }

                return false;
            }

            this._authenticatedChats.add(chatId);

            this._backuper.backupAuthData(this._authenticatedChats);

            return true;
        }

        return false;
    }
}