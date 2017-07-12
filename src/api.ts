import * as rp from 'request-promise';

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

export interface IComment {
    comment: string;
    amount: number;
}
// TODO: make me execute a request
export function check(url: string): Promise<IComment[]> {
    const options: rp.RequestPromiseOptions = {
        json: true
    };
    // make a request
    return Promise.resolve(testData.result); // FIXME: remove for testing
    /* FIXME: uncomment when API is ready
    return rp.get(url, options).then((res: any): IComment[] => {
        return res.result;
    });
    */
}