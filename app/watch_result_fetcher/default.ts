import * as rp from 'request-promise-native';
import * as config from 'config';
import * as urljoin from 'url-join';
import logger from '../logger/default';
import {IWatchResultFetcher, IFetcherApiResult, EResultType} from './interfaces';

export class DefaultWatchResultFetcher implements IWatchResultFetcher {
    protected _authHeader: string;

    constructor(
        protected _userName: string = config.get('httpAuth.userName'),
        protected _password: string = config.get('httpAuth.password')
    ) {
        this._authHeader = 'Basic ' + new Buffer(this._userName + ':' + this._password).toString('base64');
    }

    /**
     * checks API method and returns it's result
     * @param  {string} url
     * @returns Promise
     */
    public async check(url: string): Promise<IFetcherApiResult[]> {
        const options: rp.RequestPromiseOptions = {
            json: true,
            headers: {
                Authorization: this._authHeader
            }
        };

        const path: string = urljoin(url);

        logger.debug('requesting to ' + path);

        const response: {result: IFetcherApiResult[]} = await rp.get(path, options);

        logger.debug('response is', response);

        return response.result;
    }
}