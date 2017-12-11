export interface IAuth {
    isAuthenticated(chatId: string): boolean;
    authenticate(chatId: string, keyword: string): boolean;
}