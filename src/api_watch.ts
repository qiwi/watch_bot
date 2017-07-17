import {EventEmitter} from 'events';
import {StatAPI, IComment} from './api';
import * as config from 'config';

// this class watches the API for changes
export default class APIWatcher extends EventEmitter {
    public static EVENT_NEW_COMMENT: string = 'newComment';
    public static EVENT_ERROR: string = 'error';
    private isWatching: boolean = false;
    private api: StatAPI;

    constructor(host: string, private methodUrl: string, public interval: number) {
        super();
        this.api = new StatAPI(host);
    }

    // starts watching process
    public startWatching(): void {
        if (!this.isWatching) {
            this.isWatching = true;
            this.keepWatching();
        }
    }

    // stops watching process
    public stopWatching = (): void => {
        this.isWatching = false;
    }

    // gets result from API
    public recheck = async (): Promise<void> => {
        if (this.isWatching) {
            try {
                // ask API to get data
                const response: IComment[] = await this.api.check(this.methodUrl);
                // emit the watch event to give the result to whoever needs it
                if (response.length > 0) {
                    this.emit(APIWatcher.EVENT_NEW_COMMENT, response);
                }

                // continue watching process
                this.keepWatching();
            } catch ( err) {
                this.emit(APIWatcher.EVENT_ERROR, err.message);
                // continue watching process
                this.keepWatching();
            }
        }
    }

    private keepWatching(): void {
        setTimeout(this.recheck, this.interval);
    }
}