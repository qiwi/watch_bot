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
    public recheck = async (): Promise<void> => {
        if (this.isWatching) {
            try {
                logger.info('requesting to ' + this.url); // TODO: get rid of console.log
                // ask API to get data
                const response: IComment[] = await check(this.url);
                // emit the watch event to give the result to whoever needs it
                if (response.length > 0) {
                    this.emit('newComment', response);
                }

                // continue watching process
                this.keepWatching();
            } catch ( err) {
                this.emit('error', err.message);
                // continue watching process
                this.keepWatching();
            }
        }
    }

    private keepWatching(): void {
        setTimeout(this.recheck, this.interval);
    }
}