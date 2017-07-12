import * as rp from 'request-promise-native';
import * as config from 'config';

// initialize the value of the auth header
const username: string = config.get('HTTPAuth.userName');
const password: string = config.get('HTTPAuth.password');
const authHeader: string = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

const testData = { // TODO: remove me when API is ready
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

export interface IComment {
    comment: string;
    amount: number;
}
// TODO: make me execute a request
export async function check(url: string): Promise<IComment[]> {
    const options: rp.RequestPromiseOptions = {
        json: true,
        headers: {
            Authorization: authHeader
        }
    };
    // make a request
    // return testData.result; // FIXME: remove after testing
    // FIXME: uncomment when API is ready
    const response: {result: IComment[]} = await rp.get(url, options);
    return response.result;
}