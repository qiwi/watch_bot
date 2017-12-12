import {IBackuper} from './interfaces';
import {IWatcherWatchData} from '../watcher/interfaces';
import {IBotChat} from '../bot/interfaces';
import * as fs from 'fs';
import {BackuperError} from '../error/backuper';
import logger from '../logger/default';
import * as config from 'config';

export class FSBackuper implements IBackuper {
    private _activeChatsDataPath: string = config.get('backupFolder') + 'active_chats.backup.json';
    private _watcherDataPath: string = config.get('backupFolder') + 'watcher_data.backup.json';
    private _authDataPath: string = config.get('backupFolder') + 'auth_data.backup.json';

    constructor() {}

    public async backupActiveChatsData(activeChatsData: Map<string, IBotChat>): Promise<void> {
        try {
            const result = JSON.stringify({result: [...activeChatsData]});

            await this._getFsWritePromise(this._activeChatsDataPath, result);
        } catch (err){
            logger.error(err);
        }
    }

    public async backupWatcherData(activeWatchersData: Map<string, IWatcherWatchData>): Promise<void> {
        try {
            const result = JSON.stringify({result: [...activeWatchersData]});

            await this._getFsWritePromise(this._watcherDataPath, result);
        } catch (err){
            logger.error(err);
        }
    }

    public async backupAuthData(authData: Set<string>): Promise<void> {
        try {
            const result = JSON.stringify({result: Array.from(authData)});

            await this._getFsWritePromise(this._authDataPath, result);
        } catch (err){
            logger.error(err);
        }
    }

    public async getActiveChatsData(): Promise<Map<string, IBotChat>> {
        try {
            const data = await this._getFsReadPromise(this._activeChatsDataPath);

            const activeChatsData = new Map();

            data.result.forEach((chatData) => {
                activeChatsData.set(chatData[0], chatData[1]);
            });

            return activeChatsData;
        } catch (err) {
            logger.error(err);
            return new Map<string, IBotChat>();
        }

    }

    public async getWatcherData(): Promise<Map<string, IWatcherWatchData>> {
        try {
            const data = await this._getFsReadPromise(this._watcherDataPath);

            const watcherData = new Map();

            data.result.forEach((wData) => {
                watcherData.set(wData[0], wData[1]);
            });

            return watcherData;
        } catch (err) {
            logger.error(err);
            return new Map<string, IWatcherWatchData>();
        }
    }

    public async getAuthData(): Promise<Set<string>> {
        try {
            const authData = new Set();

            const data = await this._getFsReadPromise(this._authDataPath);

            data.result.forEach((chatId: string) => {
                authData.add(chatId);
            });

            return authData;
        } catch (err) {
            logger.error(err);
            return new Set<string>();
        }
    }

    protected _getFsWritePromise(path: string, data: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(path, data, 'UTF8', (err) => {
                if (err) {
                    reject(new BackuperError(err));
                } else {
                    resolve();
                }
            });
        });
    }

    protected _getFsReadPromise(path: string): Promise<any> {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(path, {encoding: 'UTF8'}, (err: any, data: string) => {
                if (err) {
                    reject(new BackuperError(err));
                } else {
                    resolve(JSON.parse(data));
                }
            });
        });
    }
}