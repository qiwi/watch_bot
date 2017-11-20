import {configMock, methodUrlMock, mockData} from './mocks';
import * as mockRequire from 'mock-require';
mockRequire('config', configMock);

import {DefaultWatchResultFetcher} from '../src/watch_result_fetcher/default';
import * as sinon from 'sinon';
import * as rp from 'request-promise-native';
import {expect} from 'chai';
import * as config from 'config';
const username: string = config.get('httpAuth.userName');
const password: string = config.get('httpAuth.password');
const url: string = config.get('general.APIUrl');
const api = new DefaultWatchResultFetcher();

describe('test suite', function(): void{
    const sandbox = sinon.sandbox.create();
    beforeEach(function(done: MochaDone): void {

        sandbox.stub(rp, 'get').callsFake(() => Promise.resolve(mockData.requestMock));
        done();
    });
    // TODO: more tests

    it('should return result, provided by request-promise-native mock', function(done: MochaDone): void {
        api.check(methodUrlMock).then((res) => {
            expect(res).to.eql(mockData.requestMock.result);
            done();
        }).catch((res) => {
            done(res);
        });
    });

    it('should give proper headers for auth', function(done: MochaDone): void {
        api.check(methodUrlMock).then((res) => {
            done();
        }).catch((res) => {
            done(res);
        });

        const fn: any = rp.get;
        const authHeader: string = fn.args[0][1].headers.Authorization;
        const res: string = Buffer.from( authHeader.split(' ')[1], 'base64').toString();

        expect(res).to.eql(username + ':' + password);
        expect(authHeader).to.include('Basic');
    });

    afterEach(function(done: MochaDone): void {
        sandbox.restore();
        done();
    });
});