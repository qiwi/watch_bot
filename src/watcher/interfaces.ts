import EventEmitter = NodeJS.EventEmitter;
import {IFetcherApiResult, IWatchResultFetcher} from '../watch_result_fetcher/interfaces';

export type IResult = IFetcherApiResult;

export enum EResultWatcherEvent {
    NEW_COMMENT = 'newComment',
    ERROR = 'error'
}

export interface IResultWatcher extends EventEmitter {
    startWatching(): void;
    stopWatching(): void;
    recheck(): Promise<void>;
    on(event: EResultWatcherEvent, handler: (payload: string | IResult) => void): any;
}