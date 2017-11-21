import * as config from 'config';
import {IWatchResultFetcher, IFetcherApiResult, EResultType} from './interfaces';

export class MockWatchResultFetcher implements IWatchResultFetcher {
    protected _authHeader: string;

    constructor(
        protected _userName: string = config.get('httpAuth.userName'),
        protected _password: string = config.get('httpAuth.password')
    ) {
        this._authHeader = 'Basic ' + new Buffer(this._userName + ':' + this._password).toString('base64');
    }

    public async check(url: string): Promise<IFetcherApiResult[]> {
        return Promise.resolve([
                {
                    type: EResultType.ENTITY,
                    meta: {
                        foo: 'foo',
                        bar: 1,
                        baz: true,
                        qux: {a: 1}
                    }
                },
                {
                    type: EResultType.ENTITY,
                    meta: {
                        foo: 'foo1',
                        bar: 2,
                        baz: false,
                        qux: {a: 1, b: {c: 'd'}}
                    }
                },
            ]
        );
    }
}