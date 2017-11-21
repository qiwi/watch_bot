export interface IFetcherApiResult {
    message: string;
    entities: Array<{
        meta: {[key: string]: any};
    }>;
}

export interface IWatchResultFetcher {
    check(url: string): Promise<IFetcherApiResult>;
}