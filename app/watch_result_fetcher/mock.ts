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
                message: 'Test',
                entities: [
                    {
                        meta: {
                            foo: 'foo',
                            bar: 1,
                            baz: true,
                            qux: {a: 1}
                        }
                    },
                    {
                        meta: {
                            foo: 'foo1',
                            bar: 2,
                            baz: false,
                            qux: {a: 1, b: {c: 'd'}}
                        }
                    },
                ]
            }
        );
    }
}