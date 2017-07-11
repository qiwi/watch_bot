import * as TelegramBot from 'node-telegram-bot-api';
import APIWatcher from './api_watch';

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, {polling: true});

const watcher = new APIWatcher('https://whatewer.com', 10 * 1000);

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

watcher.on('watch', (res: string) => {
  console.log('watching with res ' + res);
  for ( const id in activeChats) {
    if ( activeChats.hasOwnProperty(id)) {
      bot.sendMessage(id, res);
    }
  }
});