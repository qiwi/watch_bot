import * as rp from 'request-promise-native';
import * as config from 'config';
import * as urljoin from 'url-join';
import logger from '../logger/default';
// initialize the value of the auth header
const username: string = config.get('HTTPAuth.userName');
const password: string = config.get('HTTPAuth.password');
const authHeader: string = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

export interface IComment {
    comment: string;
    amount: number;
}

export class StatAPI {
    constructor(private host: string) {
        // nothing to do here yet
    }
    /**
     * checks API method and returns it's result
     * @param  {string} url
     * @returns Promise
     */
    public async check(url: string): Promise<IComment[]> {
        const options: rp.RequestPromiseOptions = {
            json: true,
            headers: {
                Authorization: authHeader
            }
        };

        const path: string = urljoin(this.host, url);
        logger.info('requesting to ' + path);
        // make a request
        const response: {result: IComment[]} = await rp.get(path, options);
        return response.result;
    }
}