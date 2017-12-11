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
    ) {}

    public bootstrap(): void {
        this._bot.onText(/\/echo (.+)/, this._createAsyncTryCatchWrapper(async (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);
            const resp = match[1];

            logger.debug('got msg', msg);

            await this._bot.sendMessage(chatId, resp);
        }));

        this._bot.onText(/\/auth (.+)/, this._createAsyncTryCatchWrapper(async (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);
            const resp = match[1];

            if (this._auth.authenticate(chatId, resp)) {
                await this._bot.sendMessage(chatId, 'Successfully authenticated. Now commands are allowed for you!');
            } else {
                await this._bot.sendMessage(chatId, 'Auth failed');
            }
        }));

        this._bot.onText(/\/auth$/, this._createAsyncTryCatchWrapper(async (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            await this._bot.sendMessage(chatId, 'You need to provide a token!');
        }));

        this._bot.onText(/\/start(.*)/, this._createAsyncTryCatchWrapper(async (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            const watchUrl = this._getWatchUrlFromMsgMatchOrConfig(match);

            if (!watchUrl) {
                await this._bot.sendMessage(chatId, 'no watch url provided');

                return;
            }

            if (this._checkAuth(chatId)) {
                this._deleteWatcher(chatId);

                const watcher = this._getOrCreateWatcher(chatId, watchUrl);

                watcher.startWatching();

                this._bot.setActive(chatId);
                await this._bot.sendMessage(chatId, 'started watching with interval: ' + watcher.getWatchInterval());
            }
        }));

        this._bot.onText(/\/check(.*)/, this._createAsyncTryCatchWrapper(async (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            const watchUrl = this._getWatchUrlFromMsgMatchOrConfig(match);

            if (!watchUrl) {
                await this._bot.sendMessage(chatId, 'no check url provided');

                return;
            }

            if (this._checkAuth(chatId)) {
                try {
                    await this._bot.sendMessage(chatId, 'Checking');

                    const watcher = new this._WatcherConstructor(watchUrl);

                    const result = await watcher.checkOnce();

                    await this._processWatcherResult(result, chatId);
                } catch (err) {
                    await this._bot.sendMessage(chatId, 'Got error: ' + err.message);
                    throw err;
                }

            }
        }));

        this._bot.onText(/\/stop_watch$/, this._createAsyncTryCatchWrapper(async (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            if (this._checkAuth((chatId))) {
                this._deleteWatcher(chatId);

                await this._bot.sendMessage(chatId, 'stopped watching');
            }
        }));

        this._bot.onText(/\/stop$/, this._createAsyncTryCatchWrapper(async (msg, match) => {
            const chatId = this._getChatIdFromMsg(msg);

            if (this._checkAuth(chatId)) {
                const watcher = this._getWatcher(chatId);

                this._bot.setInactive(chatId);

                if (this._bot.numActiveChats === 0) {
                    if (watcher) {
                        watcher.stopWatching();
                    }
                    await this._bot.sendMessage(chatId, 'stopped watching, because all users are not listening');
                } else {
                    await this._bot.sendMessage(chatId, 'stopped sending watch messages to you');
                }
            }
        }));
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

        let watcher = new this._WatcherConstructor(url);

        let errorSequenceLength = 0;

        watcher.on(EResultWatcherEvent.NEW_RESULT, async (res: IResult) => {
            errorSequenceLength = 0;
            await this._processWatcherResult(res, chatId);
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

    private _createAsyncTryCatchWrapper(
        asyncFunction: (...args: any[]) => Promise<any>
    ): (...args: any[]) => Promise<any> {

        return async (...args: any[]) => {
            try {
                return await asyncFunction.apply(this, args);
            } catch (err) {
                logger.error(err);
            }
        }
    }

    private async _processWatcherResult(res: IResult, chatId: string): Promise<void> {
        logger.info('new Messages: ' + JSON.stringify(res));

        await this._bot.sendMessage(chatId, res.message);

        let message = '';

        res.entities.forEach((entity): void => {
            message += '\n';
            Object.keys(entity.meta).forEach((key) => {
                message += `\n${key}: ${JSON.stringify(entity.meta[key])}`;
            });
        });

        let newMessage = message.substr(0, 4000);

        if (newMessage !== message) {
            newMessage += '...';
        }

        if (!!message) {
            await this._bot.sendMessage(chatId, newMessage);
        }
    }

    private _getWatchUrlFromMsgMatchOrConfig(match: string[]): string {
        logger.debug('match for url is', match[1]);

        const result = match[1].trim();

        if (result.length) {
            return result;
        }

        return config.general.defaultWatchUrl;
    }

    private _getChatIdFromMsg(msg: any): string {
        const chatId = msg.chat && msg.chat.id;

        if (util.isNullOrUndefined(chatId)) {
            throw new Error('Wrong chat id presented: ' + JSON.stringify(msg));
        }

        return chatId;
    }
}