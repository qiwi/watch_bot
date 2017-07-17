import TelegramBot = require('node-telegram-bot-api'); // required this way, because of weird error in @types
import logger from '../logger/default';
import * as config from 'config';

const numVerboseErrors: number = config.get('Generall.numVerboseErrors');

interface IChat {
    /** telegram chat id */
    id: string;
    /** maximal amount of errors to be sent to user if a huge seri of errors occurs */
    errorSequenceLength: number;
}

export default class DefaultBot extends TelegramBot {
    /** dict to store active chats */
    private activeChats: Map<string, IChat> = new Map<string, IChat>();

    constructor(token: string, options?: any) {
        super(token, options);
    }
    /**
     * Sends message and logs any occuring errors
     * @param  {string} id - telegram chat id
     * @param  {string} msg - message to be sent
     * @param  {any} options? - options to send message with
     * @returns Promise
     */
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
    /**
     * send message to all active users
     * @param  {string} message - message to be sent
     * @param  {any} options? - options to send message with
     * @returns void
     */
    public sendToAll(message: string, options?: any): void {
        this.activeChats.forEach((el, id) => this.sendMessage(id, message, options));
        return;
    }
    /**
     * sets chat active. If chat is active, bot sends messages into the chat on sendToAll call
     * @param  {string} id - telegram chat id
     * @returns void
     */
    public setActive(id: string): void {
        this.activeChats.set(id, {id, errorSequenceLength: 0});
    }
    /**
     * sets chat inactive. If chat is active, bot sends messages into the chat on sendToAll call
     * @param  {string} id - telegram chat id
     * @returns void
     */
    public setInactive(id: string): void {
        this.activeChats.delete(id);
    }
    /**
     * returns the amount of active chats
     * @returns number
     */
    get numActiveChats(): number{
        return this.activeChats.size;
    }
}