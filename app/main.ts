import {EResultWatcherEvent, IResult, IResultWatcher, IWatcherWatchData} from './watcher/interfaces';
import {IBot, IBotChat} from './bot/interfaces';
import DefaultBot from './bot/default';
import Auth from './auth/default';
import {IAuth} from './auth/interfaces';
import DefaultResultWatcher from './watcher/default';
import logger from './logger/default';
import * as config from 'config';
import * as util from 'util';
import {IBackuper} from './backuper/interfaces';
import {FSBackuper} from './backuper/fsbackuper';

export class MainApp {
    private _activeWatchers: Map<string, IResultWatcher>;
    protected _bot: IBot;
    protected _auth: IAuth;

    constructor(
        protected _WatcherConstructor: any = DefaultResultWatcher, // TODO constructor type
        protected _backuper: IBackuper = new FSBackuper()
    ) {}

    public async bootstrap(): Promise<void> {
        const authData = await this._backuper.getAuthData();
        const watcherData = await this._backuper.getWatcherData();
        const activeChatsData = await this._backuper.getActiveChatsData();

        this._bot = new DefaultBot(config.get('general.botTGToken'), {polling: true}, activeChatsData);
        this._auth = new Auth(authData);

        const activeWatchers = new Map<string, IResultWatcher>();
        watcherData.forEach((value: IWatcherWatchData, key: string) => {
            const watcher = new this._WatcherConstructor(value.watchUrl, value.watchInterval);

            this._setWatcherListeners(watcher, key);

            watcher.startWatching();
            activeWatchers.set(key, watcher);
        });

        this._activeWatchers = activeWatchers;

        await this._initBotActions();
    }

    protected _checkAuth(id: string): boolean {
        const res: boolean = this._auth.isAuthenticated(id);
        if (!res) {
            this._bot.sendMessage(id, 'You have no access to do this. To get the access run "/auth %token"');
        }
        return res;
    }

    protected _getOrCreateWatcher(chatId: string, url: string, interval?: string): IResultWatcher {
        const activeWatcher = this._activeWatchers.get(chatId);

        if (activeWatcher) {
            return activeWatcher;
        }

        let watcher = new this._WatcherConstructor(url, interval);

        this._setWatcherListeners(watcher, chatId);

        this._activeWatchers.set(chatId, watcher);

        this._backuper.backupWatcherData(this._getWatchDataFromAllActiveWatchers());

        return watcher;
    }

    protected _setWatcherListeners(watcher: IResultWatcher, chatId: string): void {
        let errorSequenceLength = 0;

        watcher.on(EResultWatcherEvent.NEW_RESULT, async (res: IResult) => {
            errorSequenceLength = 0;
            await this._processWatcherResult(res, chatId);
        });

        watcher.on(EResultWatcherEvent.ERROR, async (res: string) => {
            errorSequenceLength++;

            const message: string = 'Error: ' + res;

            logger.error('ERROR: ' + res);

            await this._bot.sendMessage(chatId, message, {error: true});
        });
    }

    protected _deleteWatcher(chatId: string): void {
        const activeWatcher = this._activeWatchers.get(chatId);

        if (activeWatcher) {
            activeWatcher.stopWatching();

            this._activeWatchers.delete(chatId);
        }

        this._backuper.backupWatcherData(this._getWatchDataFromAllActiveWatchers());
    }

    protected _createAsyncTryCatchWrapper(
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

    protected async _processWatcherResult(res: IResult, chatId: string): Promise<void> {
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

    protected async _initBotActions(): Promise<void> {
        const username = (await this._bot.getMe()).username;

        const echoAction = this._createAsyncTryCatchWrapper(
            async (msg, match) => {
                const chatId = this._getChatIdFromMsg(msg);
                const resp = this._getArgumentFromMsgMatchOrConfig(match);

                if (resp) {
                    await this._bot.sendMessage(chatId, resp);
                }
            }
        );
        const authAction = this._createAsyncTryCatchWrapper(
            async (msg, match) => {

                logger.debug('got msg', msg);
                logger.debug('got match', match);

                const chatId = this._getChatIdFromMsg(msg);
                const resp = this._getArgumentFromMsgMatchOrConfig(match);

                if (!resp) {
                    await this._bot.sendMessage(chatId, 'You need to provide a token!');
                    return;
                }

                if (this._auth.authenticate(chatId, resp)) {
                    await this._bot.sendMessage(
                        chatId, 'Successfully authenticated. Now commands are allowed for you!'
                    );
                } else {
                    await this._bot.sendMessage(chatId, 'Auth failed');
                }
            }
        );

        const startAction = this._createAsyncTryCatchWrapper(
            async (msg, match) => {
                const chatId = this._getChatIdFromMsg(msg);

                const watchUrl = this._getArgumentFromMsgMatchOrConfig(match) || config.general.defaultWatchUrl;

                if (!watchUrl) {
                    await this._bot.sendMessage(chatId, 'no watch url provided');

                    return;
                }

                if (this._checkAuth(chatId)) {
                    this._deleteWatcher(chatId);

                    const watcher = this._getOrCreateWatcher(chatId, watchUrl);

                    watcher.startWatching();

                    this._bot.setActive(chatId);
                    await this._bot.sendMessage(chatId, 'started watching with interval: ' +
                        watcher.getWatchData().watchInterval
                    );
                }
            }
        );

        const checkAction = this._createAsyncTryCatchWrapper(
            async (msg, match) => {
                const chatId = this._getChatIdFromMsg(msg);

                const watchUrl = this._getArgumentFromMsgMatchOrConfig(match) || config.general.defaultWatchUrl;

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
            }
        );

        const stopAction = this._createAsyncTryCatchWrapper(
            async (msg, match) => {
                const chatId = this._getChatIdFromMsg(msg);

                if (this._checkAuth((chatId))) {
                    this._deleteWatcher(chatId);

                    await this._bot.sendMessage(chatId, 'stopped watching');
                }
            }
        );

        const helpAction = this._createAsyncTryCatchWrapper(
            async (msg, match) => {
                const chatId = this._getChatIdFromMsg(msg);
                await this._bot.sendMessage(chatId, '/auth <token> - Make auth command');
                await this._bot.sendMessage(chatId, '/check <url> - Do check url command (single url request)');
                await this._bot.sendMessage(chatId, '/start <url> - Create url polling');
                await this._bot.sendMessage(chatId, '/stop - Stop url polling');
            }
        );

        this._getCommandRegexps('echo', username).forEach(reg => {
            this._bot.onText(
                reg,
                echoAction
            );
        });

        this._getCommandRegexps('auth', username).forEach(reg => {
            this._bot.onText(
                reg,
                authAction
            );
        });

        this._getCommandRegexps('start', username).forEach(reg => {
            this._bot.onText(
                reg,
                startAction
            );
        });

        this._getCommandRegexps('stop', username).forEach(reg => {
            this._bot.onText(
                reg,
                stopAction
            );
        });

        this._getCommandRegexps('check', username).forEach(reg => {
            this._bot.onText(
                reg,
                checkAction
            );
        });

        this._getCommandRegexps('help', username).forEach(reg => {
            this._bot.onText(
                reg,
                helpAction
            );
        });
    }

    private _getArgumentFromMsgMatchOrConfig(match: string[]): string {
        logger.debug('match for url is', match);

        let result = match[1];

        return result && result.trim();
    }

    private _getChatIdFromMsg(msg: any): string {
        const chatId = msg.chat && msg.chat.id;

        if (util.isNullOrUndefined(chatId)) {
            throw new Error('Wrong chat id presented: ' + JSON.stringify(msg));
        }

        return chatId;
    }

    private _getWatchDataFromAllActiveWatchers() {
        const watchData = new Map<string, IWatcherWatchData>();

        this._activeWatchers.forEach((value: IResultWatcher, key: string) => {
            watchData.set(key, value.getWatchData());
        });

        return watchData;
    }

    private _getCommandRegexps(command: string, username?: string): Array<RegExp> {
        return [
            new RegExp(`\/${command}@${username} (.+)?`),
            new RegExp(`\/${command} (.+)?`),
            new RegExp(`\/${command}$`),
            new RegExp(`\/${command}@${username}$`),
        ];
    }
}