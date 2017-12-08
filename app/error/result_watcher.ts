export class ResultWatcherError extends Error {
    constructor(err: any) {
        super('Fetch result error: ' + err && err.message);
    }
}