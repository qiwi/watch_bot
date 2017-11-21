export const configMock = {
    'general.defaultInterval': 10000,
    'general.botTGToken': '434088985:AAHs1qidPnm_o1v6RhM9zocotnMkJ-DpYes',
    'general.numVerboseErrors': 20,
    'general.APIUrl': 'http://localhost:9080/rnd_features_stats',

    'httpAuth.method': 'JWT',
    'httpAuth.token': '*',

    'logger.logLevel': 'debug',
    'botAuth.token': '*',

    get(key: string): any {
        return configMock[key];
    }
};

export const methodUrlMock = 'http://localhost/test';

export const mockData = {
    requestMock: {
        result:
            [
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
    }
};