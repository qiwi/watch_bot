import * as log4js from 'log4js';

log4js.configure({
  appenders: { full: { type: 'file', filename: 'full.log' } , console: {type: 'console'}},
  categories: { default: { appenders: ['console'], level: 'info' }, full: { appenders: ['full'], level: 'debug' } }
});

const logger = log4js.getLogger('console');
export default  logger;