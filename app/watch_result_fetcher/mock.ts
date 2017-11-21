import * as config from 'config';
import {IWatchResultFetcher, IFetcherApiResult} from './interfaces';

export class MockWatchResultFetcher implements IWatchResultFetcher {
    protected _authHeader: string;

    constructor(
        protected _token: string = config.get('auth.token'),
        protected _method: string = config.get('auth.method'),
    ) {
        this._authHeader = this._method + ' ' + this._token;
    }

    public async check(url: string): Promise<IFetcherApiResult> {
        return Promise.resolve(
            {
                message: 'Your message',
                entities: [
                    {
                        meta: {
                            "key": "value",
                            "anotherKey": 123
                        }
                    },
                    {
                        meta: {
                            "key": "value 2",
                            "anotherKey": {a: 123}
                        }
                    }
                ]
            }
        );
    }
}