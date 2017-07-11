import {check} from '../src/api';
import * as sinon from 'sinon';
import * as rp from 'request-promise';
import {expect} from 'chai';

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

    it('should be true', function(done: MochaDone): void {
        check('google.com').then((res) => {
            expect(res).to.eql(testData.result);
            done();
        }).catch((res) => {
            done(res);
        });

        // FIXME: should be used
        /*expect(rp.get.args).to.eql([[
          'google.com',
          {
            json: true
          }
        ]]);*/
    });

    afterEach(function(done: MochaDone): void {
        sandbox.restore();
        done();
    });
});