export enum EResultType {
    ENTITY = 'entity'
}

export interface IFetcherApiResult {
    type: EResultType;
    meta: {[key: string]: any};
}

export interface IWatchResultFetcher {
    check(url: string): Promise<IFetcherApiResult[]>;
}