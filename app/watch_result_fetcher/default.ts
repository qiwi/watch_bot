import * as rp from 'request-promise-native';
import * as config from 'config';
import * as urljoin from 'url-join';
import logger from '../logger/default';
import {IWatchResultFetcher, IFetcherApiResult, EResultType} from './interfaces';

export class DefaultWatchResultFetcher implements IWatchResultFetcher {
    protected _authHeader: string;

    constructor(
        protected _token: string = config.get('auth.token'),
        protected _method: string = config.get('auth.method'),
    ) {
        this._authHeader = this._method + ' ' + this._token;
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