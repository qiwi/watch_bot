import TelegramBot = require('node-telegram-bot-api'); // required this way, because of weird error in @types
import APIWatcher from './api_watch';
import {IComment} from './api';
import * as config from 'config';

const token: string = config.get('Generall.botTGToken');
const bot: TelegramBot = new TelegramBot(token, {polling: true});

const watcher = new APIWatcher('https://whatewer.com', config.get('Generall.defaultInterval')); // TODO: fix the link

bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

const activeChats = {};

bot.onText(/\/start/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  watcher.startWatching();
  // remember the chat to send watch messages
  activeChats[chatId] = true;
  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, 'started watching');
});

bot.onText(/\/stop/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  watcher.stopWatching();

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, 'stopped watching');
});

watcher.on('newComment', (res: IComment[]) => {
  console.log('new Messages: ' + res);  // TODO: remove console.log

  res.forEach((comment: IComment): void => {
    // send and log every new comment
    const message: string = 'New Message:\n' + comment.comment + '\nWith amount: ' + comment.amount;
    console.log('Message: ' + message);
    for ( const id in activeChats) {
      if ( activeChats.hasOwnProperty(id)) {
        bot.sendMessage(id, message);
      }
    }
  });
});
watcher.on('error', (res: string) => {
  console.log('error ' + res);  // TODO: remove console.log
  for ( const id in activeChats) {
    if ( activeChats.hasOwnProperty(id)) {
      bot.sendMessage(id, res);
    }
  }
});
