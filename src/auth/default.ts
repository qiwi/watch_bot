export default class Auth {
    private authentificated: Set<string> = new Set<string>();
    public isAuthentificated(id: string): boolean {
        return this.authentificated.has(id);
    }
    public authentificate(id: string): void {
        this.authentificated.add(id);
    }
}