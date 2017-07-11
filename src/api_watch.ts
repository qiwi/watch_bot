import {EventEmitter} from 'events';
import {getRandomIntInclusive} from './utils';

// this class watches the API for changes
export default class APIWatcher extends EventEmitter {

    private isWatching: boolean = false;

    constructor(public url: string, public interval: number) {
        super();
    }

    // starts watching process
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
    public check(): void {// TODO: make me execute a request
        if (this.isWatching) {
            console.log('requesting to ' + this.url); // TODO: get rid of console.log
            const res = '' + getRandomIntInclusive(0, 100); // process request

            // emit the watch event to give the result to whoever needs it
            this.emit('watch', res);

            // continue watching process
            this.keepWatching();
        }
    }

    private keepWatching(): void {
        setTimeout(this.check, this.interval);
    }
}