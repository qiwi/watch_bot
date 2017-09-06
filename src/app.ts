import APIWatcher from './watcher/default';
import {IComment} from './api/default';
import * as config from 'config';
import logger from './logger/default';
import DefaultBot from './bot/default';
import Auth from './auth/default';

// load configs
const TGtoken: string = config.get('Generall.botTGToken');
const token: string = config.get('BotAuth.token');
const defaultInterval: number = config.get('Generall.defaultInterval');
const url: string = config.get('Generall.APIUrl');
const methodUrl: string = config.get('Generall.watchMethod');
// init the bot
const bot: DefaultBot = new DefaultBot(TGtoken, {polling: true});
// init watcher
const watcher: APIWatcher = new APIWatcher(url, methodUrl, defaultInterval);
const auth: Auth = new Auth();

const defaultMessageOptions = {parse_mode: 'Markdown'};

function checkAuth(id: string): boolean {
    const res: boolean = auth.isAuthentificated(id);
    if (!res) {
      bot.sendMessage(id, 'You have no access to do this. To get the access run "/auth %token"');
    }
    return res;
}

bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

bot.onText(/\/auth (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  // TODO: add time limit for auth attempts
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured token
  if (resp === token) {
    auth.authentificate(chatId);
    bot.sendMessage(chatId, 'Successfully authentificated. Now commands are allowed for you!');
  } else {
    bot.sendMessage(chatId, 'Wrong token!');
  }
});

bot.onText(/\/auth$/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  // TODO: add time limit for auth attempts
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured token
  bot.sendMessage(chatId, 'You need to provide a token!');
});

bot.onText(/\/start/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;
  if (checkAuth(chatId)) {
    watcher.startWatching();
    // remember the chat to send watch messages
    bot.setActive(chatId);
    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, 'started watching');
  }
});

// stops watching API on /stop_watch command execution
bot.onText(/\/stop_watch$/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  if (checkAuth(chatId)) {
    watcher.stopWatching();
    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, 'stopped watching');
  }
});

// stops sending messages on /stop command execution
bot.onText(/\/stop$/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  if (checkAuth(chatId)) {
    bot.setInactive(chatId);

    if (bot.numActiveChats === 0) {// if nobody is going to listen, stop watching
      watcher.stopWatching();
      bot.sendMessage(chatId, 'stopped watching, because all users are not listening');
    } else {
      bot.sendMessage(chatId, 'stopped sending watch messages to you');
    }
  }
});

let errorSequenceLength: number = 0;

// send new comments
watcher.on(APIWatcher.EVENT_NEW_COMMENT, (res: IComment[]) => {
  errorSequenceLength = 0;
  logger.info('new Messages: ' + res);
  res.forEach((comment: IComment): void => {
    // send and log every new comment
    const message: string = '*New Message*:\n' + comment.comment +
        '\n*With amount*: ' + comment.amount +
        '\n*Id*: ' + comment.idPayment;
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
