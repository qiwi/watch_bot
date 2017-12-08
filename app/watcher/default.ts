import {EventEmitter} from 'events';
import {DefaultWatchResultFetcher} from '../watch_result_fetcher/default';
import {EResultWatcherEvent, IResult, IResultWatcher} from './interfaces';
import {IFetcherApiResult, IWatchResultFetcher} from '../watch_result_fetcher/interfaces';
import {ResultWatcherError} from '../error/result_watcher';

export default class DefaultResultWatcher extends EventEmitter implements IResultWatcher {
    private _isWatching: boolean = false;

    constructor(
        protected _methodUrl: string,
        protected _interval: number = 10000,
        protected _api: IWatchResultFetcher = new DefaultWatchResultFetcher()
    ) {
        super();
    }

    public async checkOnce(): Promise<IResult> {
        try {
            return await this._api.check(this._methodUrl);
        } catch (err) {
            throw new ResultWatcherError(err);
        }
    }

    /**
     * starts watching process
     * @returns void
     */
    public startWatching(): void {
        if (!this._isWatching) {
            this._isWatching = true;
            this.keepWatching();
        }
    }

    /**
     * stops watching process
     * @returns void
     */
    public stopWatching(): void {
        this._isWatching = false;
    }

    /**
     * gets result from API
     * @returns Promise
     */
    public async recheck(): Promise<void> {
        if (this._isWatching) {
            try {
                const response: IFetcherApiResult = await this._api.check(this._methodUrl);

                if (response.entities.length > 0) {
                    this.emit(EResultWatcherEvent.NEW_RESULT, response);
                }

                this.keepWatching();
            } catch (err) {
                this.emit(EResultWatcherEvent.ERROR, err.message);
                this.keepWatching();
            }
        }
    }

    /**
     * gets result from API
     * @returns void
     */
    private keepWatching(): void {
        setTimeout(this.recheck.bind(this), this._interval);
    }
}