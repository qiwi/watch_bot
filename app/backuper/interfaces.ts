import {IBotChat} from '../bot/interfaces';
import {IWatcherWatchData} from '../watcher/interfaces';

export interface IBackuper {
    backupActiveChatsData(activeChatsData: Map<string, IBotChat>): Promise<void>;
    backupWatcherData(activeWatchersData: Map<string, IWatcherWatchData>): Promise<void>;
    backupAuthData(authData: Set<string>): Promise<void>;

    getActiveChatsData(): Promise<Map<string, IBotChat>>;
    getWatcherData(): Promise<Map<string, IWatcherWatchData>>;
    getAuthData(): Promise<Set<string>>;
}