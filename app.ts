
import {MainApp} from './app/main';

const app = new MainApp();

app.bootstrap().then(() => {
    console.log('Bot is ready');
}).catch((err) => {
    console.error(err);
});