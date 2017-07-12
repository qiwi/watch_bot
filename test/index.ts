import {check} from '../src/api';
import * as sinon from 'sinon';
import * as rp from 'request-promise-native';
import {expect} from 'chai';
import * as config from 'config';

const username: string = config.get('HTTPAuth.userName');
const password: string = config.get('HTTPAuth.password');

describe('test suite', function(): void{
    const sandbox = sinon.sandbox.create();
    const testData = {
        result: [
            {
                amount: 6000,
                status: 'ACTUAL',
                comment: null
            },
            {
                amount: 7000,
                status: 'ACTUAL',
                comment: null
            },
            {
                amount: 7000,
                status: 'ACTUAL',
                comment: null
            },
            {
                amount: 10000,
                status: 'ACTUAL',
                comment: 'test'
            }
        ]
    };

    beforeEach(function(done: MochaDone): void {

        sandbox.stub(rp, 'get').callsFake(() => Promise.resolve(testData));
        done();
    });
    // TODO: more tests

    it('should return result, provided by request-promise-native mock', function(done: MochaDone): void {
        check('google.com').then((res) => {
            expect(res).to.eql(testData.result);
            done();
        }).catch((res) => {
            done(res);
        });
    });

    it('should give proper headers for auth', function(done: MochaDone): void {
        check('google.com').then((res) => {
            done();
        }).catch((res) => {
            done(res);
        });

        const authHeader: string = rp.get.args[0][1].headers.Authorization;
        const res: string = Buffer.from( authHeader.split(' ')[1], 'base64').toString();

        expect(res).to.eql(username + ':' + password);
        expect(authHeader).to.include('Basic');
    });

    afterEach(function(done: MochaDone): void {
        sandbox.restore();
        done();
    });
});