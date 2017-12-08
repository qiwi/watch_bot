import {EventEmitter} from 'events';
import {DefaultWatchResultFetcher} from '../watch_result_fetcher/default';
import {EResultWatcherEvent, IResult, IResultWatcher} from './interfaces';
import {IFetcherApiResult, IWatchResultFetcher} from '../watch_result_fetcher/interfaces';
import {ResultWatcherError} from '../error/result_watcher';
import {CronJob} from 'cron';
import * as config from 'config';

export default class DefaultResultWatcher extends EventEmitter implements IResultWatcher {
    private _cronJob: CronJob;

    constructor(
        protected _methodUrl: string,
        protected _cronTime: string = config.get('general.defaultCronTime'),
        protected _api: IWatchResultFetcher = new DefaultWatchResultFetcher()
    ) {
        super();
    }

    public getWatchInterval(): string {
        return this._cronTime;
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
        this._cronJob = this._cronJob || new CronJob({
            cronTime: this._cronTime,
            onTick: this._cronTickFunc.bind(this),
            start: false
        });

        this._cronJob.start();
    }

    /**
     * stops watching process
     * @returns void
     */
    public stopWatching(): void {
        this._cronJob.stop();
    }

    private async _cronTickFunc(): Promise<void> {
        try {
            const response: IFetcherApiResult = await this._api.check(this._methodUrl);

            if (response.entities.length > 0) {
                this.emit(EResultWatcherEvent.NEW_RESULT, response);
            }
        } catch (err) {
            this.emit(EResultWatcherEvent.ERROR, err.message);
        }
    }
}