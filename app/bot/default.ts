import TelegramBot = require('node-telegram-bot-api'); // required this way, because of weird error in @types
import logger from '../logger/default';
import * as config from 'config';
import {IBot, IBotChat} from './interfaces';
import {IBackuper} from '../backuper/interfaces';
import {FSBackuper} from '../backuper/fsbackuper';

const numVerboseErrors: number = config.get('general.numVerboseErrors');

export default class DefaultBot extends TelegramBot implements IBot {
    constructor(
        token: string,
        options?: any,
        private _activeChats: Map<string, IBotChat> = new Map<string, IBotChat>(),
        protected _backuper: IBackuper = new FSBackuper()
    ) {
        super(token, options);
    }
    /**
     * Sends message and logs any occuring errors
     * @param  {string} id - telegram chat id
     * @param  {string} msg - message to be sent
     * @param  {any} options? - options to send message with
     * @returns Promise
     */
    public async sendMessage(id: string, msg: string, options?: any): Promise<void> {
        const chat: IBotChat = this._activeChats.get(id);
        let doSend: boolean = true;

        try {
            if (chat) {
                if (options && options.error) {
                    chat.errorSequenceLength++;
                    if (chat.errorSequenceLength > numVerboseErrors) {
                        doSend = false;
                    }
                } else {
                    chat.errorSequenceLength = 0;
                }
                this._activeChats.set(id, chat);
                this._backuper.backupActiveChatsData(this._activeChats);
            }
            if (doSend) {
                await super.sendMessage(id, msg, options);
            }
        } catch (err) {
            logger.error('SendMessage ERROR: ', err.message);
        }
    }
    /**
     * Send message to all active users
     * @param  {string} message - message to be sent
     * @param  {any} options? - options to send message with
     * @returns void
     */
    public sendToAll(message: string, options?: any): void {
        this._activeChats.forEach((el, id) => this.sendMessage(id, message, options));
    }
    /**
     * Sets chat active. If chat is active, bot sends messages into the chat on sendToAll call
     * @param  {string} id - telegram chat id
     * @returns void
     */
    public setActive(id: string): void {
        this._activeChats.set(id, {id, errorSequenceLength: 0});
        this._backuper.backupActiveChatsData(this._activeChats);
    }
    /**
     * Sets chat inactive. If chat is active, bot sends messages into the chat on sendToAll call
     * @param  {string} id - telegram chat id
     * @returns void
     */
    public setInactive(id: string): void {
        this._activeChats.delete(id);
        this._backuper.backupActiveChatsData(this._activeChats);
    }
    /**
     * Returns the amount of active chats
     * @returns number
     */
    get numActiveChats(): number{
        return this._activeChats.size;
    }
}