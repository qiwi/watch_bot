import EventEmitter = NodeJS.EventEmitter;
import {IFetcherApiResult} from '../watch_result_fetcher/interfaces';

export type IResult = IFetcherApiResult;

export enum EResultWatcherEvent {
    NEW_RESULT = 'newResult',
    ERROR = 'error'
}

export interface IResultWatcher extends EventEmitter {
    startWatching(): void;
    stopWatching(): void;
    recheck(): Promise<void>;
    checkOnce(): Promise<IResult>
    on(event: EResultWatcherEvent, handler: (payload: string | IResult) => void): any;
}