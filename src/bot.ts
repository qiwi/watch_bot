import TelegramBot = require('node-telegram-bot-api'); // required this way, because of weird error in @types
import logger from './logger';
import * as config from 'config';

const numVerboseErrors: number = config.get('Generall.numVerboseErrors');

interface IChat {
    id: string;
    errorSequenceLength: number;
}

export default class DefaultBot extends TelegramBot {
    // dict to store active chats
    private activeChats: Map<string, IChat> = new Map<string, IChat>();

    constructor(token: string, options?: any) {
        super(token, options);
    }
    public async sendMessage(id: string, msg: string, options?: any): Promise<any> {
        const chat: IChat = this.activeChats.get(id);
        let doSend: boolean = true;
        if (chat) {
            if (options && options.error) {
                chat.errorSequenceLength++;
                if (chat.errorSequenceLength > numVerboseErrors) {
                    doSend = false;
                }
            } else {
                chat.errorSequenceLength = 0;
            }
            this.activeChats.set(id, chat);
        }
        if (doSend) {
            try {
                await super.sendMessage(id, msg, options);
            } catch (err) {
                logger.error('SendMessage ERROR: ', err.message);
            }
        }
        return;
    }

    public sendToAll(message: string, options?: any): void {
        this.activeChats.forEach((el, id) => this.sendMessage(id, message, options));
        return;
    }

    public setActive(id: string): void {
        this.activeChats.set(id, {id, errorSequenceLength: 0});
    }
    public setInactive(id: string): void {
        this.activeChats.delete(id);
    }

    get numActiveChats(): number{
        return this.activeChats.size;
    }
}