import * as log4js from 'log4js';
import * as config from 'config';

const logLevel: string = config.get('Logger.logLevel');

log4js.configure({
  appenders: { full: { type: 'file', filename: 'full.log' } , console: {type: 'console'}},
  categories: {
    default: { appenders: ['console'], level: logLevel }
  }
});

const logger = log4js.getLogger('console');
export default  logger;