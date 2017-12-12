export class BackuperError extends Error {
    constructor(err: any) {
        super('Backuper error: ' + err && err.message);
    }
}