import {EventEmitter} from 'events';
import {DefaultWatchResultFetcher} from '../watch_result_fetcher/default';
import {EResultWatcherEvent, IResult, IResultWatcher, IWatcherWatchData} from './interfaces';
import {IFetcherApiResult, IWatchResultFetcher} from '../watch_result_fetcher/interfaces';
import {ResultWatcherError} from '../error/result_watcher';
import {CronJob} from 'cron';
import * as config from 'config';

export default class DefaultResultWatcher extends EventEmitter implements IResultWatcher {
    private _cronJob: CronJob;
    private _watchData: IWatcherWatchData;

    constructor(
        watchUrl: string,
        watchInterval: string = config.get('general.defaultCronTime'),
        protected _api: IWatchResultFetcher = new DefaultWatchResultFetcher()
    ) {
        super();
        this._watchData = {
            watchUrl,
            watchInterval
        }
    }

    public getWatchData(): IWatcherWatchData {
        return this._watchData;
    }

    public async checkOnce(): Promise<IResult> {
        try {
            return await this._api.check(this._watchData.watchUrl);
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
            cronTime: this._watchData.watchInterval,
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
            const response: IFetcherApiResult = await this._api.check(this._watchData.watchUrl);

            if (response.entities.length > 0) {
                this.emit(EResultWatcherEvent.NEW_RESULT, response);
            }
        } catch (err) {
            this.emit(EResultWatcherEvent.ERROR, err.message);
        }
    }
}