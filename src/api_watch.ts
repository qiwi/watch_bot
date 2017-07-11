import {EventEmitter} from 'events';

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive 
}

// this class watches the API for changes
export default class APIWatcher extends EventEmitter {

    private isWatching: boolean = false;

    constructor(public url: string, public interval: number) {
        super();
        this.check = this.check.bind(this);
    }

    // starts watching process
    public startWatching(): void {
        if (!this.isWatching) {
            this.isWatching = true;
            this.keepWatching();
        }
    }

    // starts watching process
    public stopWatching(): void {
        this.isWatching = false;
    }

    // gets result from API
    public check(): void {// TODO: make me execute a request
        if (this.isWatching) {
            console.log('requesting to ' + this.url);
            const res = '' + Math.random(); // process request

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