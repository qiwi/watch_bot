import EventEmitter = NodeJS.EventEmitter;
import {IFetcherApiResult} from '../watch_result_fetcher/interfaces';

export type IResult = IFetcherApiResult;

export enum EResultWatcherEvent {
    NEW_RESULT = 'newResult',
    ERROR = 'error'
}

export interface IWatcherWatchData {
    watchUrl: string;
    watchInterval: string;
}

export interface IResultWatcher extends EventEmitter {
    startWatching(): void;
    stopWatching(): void;
    checkOnce(): Promise<IResult>;
    getWatchData(): Readonly<IWatcherWatchData>;
    on(event: EResultWatcherEvent, handler: (payload: string | IResult) => void): any;
}