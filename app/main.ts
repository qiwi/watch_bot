import {EResultWatcherEvent, IResult, IResultWatcher} from './watcher/interfaces';
import {IBot} from './bot/interfaces';
import DefaultBot from './bot/default';
import Auth from './auth/default';
import {IAuth} from './auth/interfaces';
import DefaultResultWatcher from './watcher/default';
import logger from './logger/default';
import * as config from 'config';
import * as util from 'util';

export class MainApp {
    private _activeWatchers: Map<string, IResultWatcher> = new Map<string, IResultWatcher>();

    constructor(
        protected _bot: IBot = new DefaultBot(config.get('general.botTGToken'), {polling: true}),
        protected _auth: IAuth = new Auth(),
        protected _WatcherConstructor: any = DefaultResultWatcher, // TODO constructor type
        protected _botAuthToken: string = config.get('botAuth.token'),
        protected _pollIntervalMs: number = config.get('general.defaultInterval')
    ) {}

    public bootstrap(): void {
        this._bot.onText(/\/echo (.+)/, (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);
            const resp = match[1];

            this._bot.sendMessage(chatId, resp);
        });

        this._bot.onText(/\/auth (.+)/, (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);
            const resp = match[1];

            if (resp === this._botAuthToken) {
                this._auth.authenticate(chatId);
                this._bot.sendMessage(chatId, 'Successfully authenticated. Now commands are allowed for you!');
            } else {
                this._bot.sendMessage(chatId, 'Wrong token!');
            }
        });

        this._bot.onText(/\/auth$/, (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            this._bot.sendMessage(chatId, 'You need to provide a token!');
        });

        this._bot.onText(/\/start (.+)/, (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            if (this._checkAuth(chatId)) {
                this._deleteWatcher(chatId);

                const watcher = this._getOrCreateWatcher(chatId, match[1]);

                watcher.startWatching();

                this._bot.setActive(chatId);
                this._bot.sendMessage(chatId, 'started watching');
            }
        });

        this._bot.onText(/\/start$/, (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            this._bot.sendMessage(chatId, 'You need to provide watch url');
        });

        this._bot.onText(/\/stop_watch$/, (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            if (this._checkAuth((chatId))) {
                this._deleteWatcher(chatId);

                this._bot.sendMessage(chatId, 'stopped watching');
            }
        });

        this._bot.onText(/\/stop$/, (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            if (this._checkAuth(chatId)) {
                const watcher = this._getWatcher(chatId);

                this._bot.setInactive(chatId);

                if (this._bot.numActiveChats === 0) {
                    if (watcher) {
                        watcher.stopWatching();
                    }
                    this._bot.sendMessage(chatId, 'stopped watching, because all users are not listening');
                } else {
                    this._bot.sendMessage(chatId, 'stopped sending watch messages to you');
                }
            }
        });
    }

    protected _getChatIdFromMsg(msg: any): string {
        const chatId = msg.chat && msg.chat.id;

        if (util.isNullOrUndefined(chatId)) {
            throw new Error('Wrong chat id presented: ' + JSON.stringify(msg));
        }

        return chatId;
    }

    protected _checkAuth(id: string): boolean {
        const res: boolean = this._auth.isAuthenticated(id);
        if (!res) {
            this._bot.sendMessage(id, 'You have no access to do this. To get the access run "/auth %token"');
        }
        return res;
    }

    protected _getWatcher(chatId: string): IResultWatcher {
        return this._activeWatchers.get(chatId);
    }

    protected _getOrCreateWatcher(chatId: string, url: string): IResultWatcher {
        const activeWatcher = this._activeWatchers.get(chatId);

        if (activeWatcher) {
            return activeWatcher;
        }

        let watcher = new this._WatcherConstructor(url, this._pollIntervalMs);

        let errorSequenceLength = 0;

        watcher.on(EResultWatcherEvent.NEW_RESULT, async (res: IResult) => {
            errorSequenceLength = 0;

            logger.info('new Messages: ' + res);

            await this._bot.sendMessage(chatId, res.message);

            let message = '';

            res.entities.forEach((entity): void => {
                Object.keys(entity.meta).forEach((key) => {
                    message += `\n${key}: ${JSON.stringify(entity.meta[key])}`;
                });
            });

            message = message.substr(0, 4000) + '...';

            if (!!message) {
                this._bot.sendMessage(chatId, message);
            }
        });

        watcher.on(EResultWatcherEvent.ERROR, (res: string) => {
            errorSequenceLength++;

            const message: string = 'Error: ' + res;

            logger.error('ERROR: ' + res);

            this._bot.sendMessage(chatId, message, {error: true});
        });

        this._activeWatchers.set(chatId, watcher);

        return watcher;
    }

    protected _deleteWatcher(chatId: string): void {
        const activeWatcher = this._activeWatchers.get(chatId);

        if (activeWatcher) {
            activeWatcher.stopWatching();

            this._activeWatchers.delete(chatId);
        }
    }
}