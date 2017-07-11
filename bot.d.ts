/// <reference types="node" />
declare module "api_watch" {
    import { EventEmitter } from 'events';
    export default class APIWatcher extends EventEmitter {
        url: string;
        interval: number;
        constructor(url: string, interval: number);
        private isWatching;
        startWatching(): void;
        stopWatching(): void;
        check(): void;
    }
}
declare module "bot" {
}
