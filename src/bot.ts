import TelegramBot = require('node-telegram-bot-api'); // required this way, because of weird error in @types
import APIWatcher from './api_watch';
import {IComment} from './api';
import * as config from 'config';
import logger from './logger';

// load configs
const token: string = config.get('Generall.botTGToken');
const numVerboseErrors: number = config.get('Generall.numVerboseErrors');
const defaultInterval: number = config.get('Generall.defaultInterval');
const url: string = config.get('Generall.APIUrl');
// init the bot
const bot: TelegramBot = new TelegramBot(token, {polling: true});
// init watcher
const watcher: APIWatcher = new APIWatcher(url, defaultInterval);

// bot.sendMessage wrapper, that resolves return promises
function sendMessage(id: number, msg: string, options?: any): void {
  bot.sendMessage(id, msg, options).then((res: any): void => {return; }).catch((err: Error): void => {
    logger.error('SendMessage ERROR: ', err.message);
  });
}

// dict to store active chats
const activeChats = {};
function sendToAll(message: string, options?: any): void {
  Object.keys(activeChats).forEach((id) => sendMessage(parseInt(id, 10), message, options));
  return;
}

const defaultMessageOptions = {parse_mode: 'Markdown'};

bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  sendMessage(chatId, resp);
});

bot.onText(/\/start/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  watcher.startWatching();
  // remember the chat to send watch messages
  activeChats[chatId] = true;
  // send back the matched "whatever" to the chat
  sendMessage(chatId, 'started watching');
});

// stops watching API on /stop_watch command execution
bot.onText(/\/stop_watch$/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  watcher.stopWatching();

  // send back the matched "whatever" to the chat
  sendMessage(chatId, 'stopped watching');
});

// stops sending messages on /stop command execution
bot.onText(/\/stop$/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  delete activeChats[chatId];

  if (Object.keys(activeChats).length === 0) {// if nobody is going to listen, stop watching
    watcher.stopWatching();
  }
  // send back the matched "whatever" to the chat
  sendMessage(chatId, 'stopped sending watch messages to you');
});

let errorSequenceLength: number = 0;

// send new comments
watcher.on('newComment', (res: IComment[]) => {
  errorSequenceLength = 0;
  logger.info('new Messages: ' + res);

  res.forEach((comment: IComment): void => {
    // send and log every new comment
    const message: string = '*New Message*:\n' + comment.comment + '\n*With amount*: ' + comment.amount;
    logger.info('Message: ' + message);
    sendToAll(message, defaultMessageOptions);
  });
});

// send a message if there's an error
watcher.on('error', (res: string) => {
  errorSequenceLength++;
  const message: string = '*error* ' + res;
  logger.error('ERROR: ' + res);
  if (errorSequenceLength <= numVerboseErrors) {
    sendToAll(message, defaultMessageOptions);
  }
});
