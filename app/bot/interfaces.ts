import TelegramBot = require('node-telegram-bot-api');

export interface IBot extends TelegramBot {
    numActiveChats: number;

    sendMessage(id: string, msg: string, options?: any): Promise<void>;
    sendToAll(message: string, options?: any): void;
    setActive(id: string): void;
    setInactive(id: string): void;
}

export interface IBotChat {
    /** telegram chat id */
    id: string;
    /** maximal amount of errors to be sent to user if a huge seri of errors occurs */
    errorSequenceLength: number;
}