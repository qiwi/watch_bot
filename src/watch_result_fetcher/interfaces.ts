export enum EResultType {
    ENTITY = 'entity'
}

export interface IFetcherApiResult {
    type: EResultType;
    meta: {[key: string]: string};
}

export interface IWatchResultFetcher {
    check(url: string): Promise<IFetcherApiResult[]>;
}