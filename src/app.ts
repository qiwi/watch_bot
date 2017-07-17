import APIWatcher from './watcher/default';
import {IComment} from './api/default';
import * as config from 'config';
import logger from './logger/default';
import DefaultBot from './bot/default';

// load configs
const token: string = config.get('Generall.botTGToken');
const defaultInterval: number = config.get('Generall.defaultInterval');
const url: string = config.get('Generall.APIUrl');
const methodUrl: string = config.get('Generall.watchMethod');
// init the bot
const bot: DefaultBot = new DefaultBot(token, {polling: true});
// init watcher
const watcher: APIWatcher = new APIWatcher(url, methodUrl, defaultInterval);

const defaultMessageOptions = {parse_mode: 'Markdown'};

bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

bot.onText(/\/start/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;
  watcher.startWatching();
  // remember the chat to send watch messages
  bot.setActive(chatId);
  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, 'started watching');
});

// stops watching API on /stop_watch command execution
bot.onText(/\/stop_watch$/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  watcher.stopWatching();
  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, 'stopped watching');
});

// stops sending messages on /stop command execution
bot.onText(/\/stop$/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  bot.setInactive(chatId);

  if (bot.numActiveChats === 0) {// if nobody is going to listen, stop watching
    watcher.stopWatching();
    bot.sendMessage(chatId, 'stopped watching, bcause all users are not listening');
  } else {
    bot.sendMessage(chatId, 'stopped sending watch messages to you');
  }
});

let errorSequenceLength: number = 0;

// send new comments
watcher.on(APIWatcher.EVENT_NEW_COMMENT, (res: IComment[]) => {
  errorSequenceLength = 0;
  logger.info('new Messages: ' + res);
  res.forEach((comment: IComment): void => {
    // send and log every new comment
    const message: string = '*New Message*:\n' + comment.comment + '\n*With amount*: ' + comment.amount;
    logger.info('Message: ' + message);
    bot.sendToAll(message, defaultMessageOptions);
  });
});

// send a message if there's an error
watcher.on(APIWatcher.EVENT_ERROR, (res: string) => {
  errorSequenceLength++;
  const message: string = '*error* ' + res;
  logger.error('ERROR: ' + res);
  const options = Object.assign({error: true}, defaultMessageOptions);
  bot.sendToAll(message, options);
});
