import {EventEmitter} from 'events';
import {DefaultWatchResultFetcher} from '../watch_result_fetcher/default';
import {EResultWatcherEvent, IResultWatcher} from './interfaces';
import {IFetcherApiResult, IWatchResultFetcher} from '../watch_result_fetcher/interfaces';

export default class DefaultResultWatcher extends EventEmitter implements IResultWatcher {
    private _isWatching: boolean = false;

    constructor(
        protected _methodUrl: string,
        protected _interval: number,
        protected _api: IWatchResultFetcher = new DefaultWatchResultFetcher()
    ) {
        super();
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
                const response: IFetcherApiResult[] = await this._api.check(this._methodUrl);

                if (response.length > 0) {
                    this.emit(EResultWatcherEvent.NEW_COMMENT, response);
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