export class BotRuntimeError extends Error {
    constructor(err: any) {
        super('Bot runtime error: ' + err && err.message);
    }
}