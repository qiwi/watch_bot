import {EventEmitter} from 'events';
import {check, IComment} from './api';
import logger from './logger';

// this class watches the API for changes
export default class APIWatcher extends EventEmitter {

    private isWatching: boolean = false;

    constructor(public url: string, public interval: number) {
        super();
    }

    public startWatching(): void {
        if (!this.isWatching) {
            this.isWatching = true;
            this.keepWatching();
        }
    }

    // starts watching process
    public stopWatching = (): void => {
        this.isWatching = false;
    }

    // gets result from API
    public recheck = (): void => {
        if (this.isWatching) {
            logger.info('requesting to ' + this.url); // TODO: get rid of console.log
            // ask API to get data
            check(this.url).then((res: IComment[]): void => {
                // emit the watch event to give the result to whoever needs it
                if (res.length > 0) {
                    this.emit('newComment', res);
                }

                // continue watching process
                this.keepWatching();
            }).catch((err: Error): void => {
                this.emit('error', err.message);
                // continue watching process
                this.keepWatching();
            });
        }
    }

    private keepWatching(): void {
        setTimeout(this.recheck, this.interval);
    }
}