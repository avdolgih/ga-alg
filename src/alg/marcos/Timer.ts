export default class Timer {

    public readonly ms: number;
    private timer?: NodeJS.Timeout;
    private _timeout: boolean = false;

    constructor(ms: number) {
        this.ms = ms;
    }

    public get timeout(): boolean {
        return this._timeout;
    }

    public start(callback: () => void) {
        this.stop();
        this.timer = setTimeout(() => {
            this._timeout = true;
            callback();
        }, this.ms);
    }

    public stop() {
        if (!this.timer)
            return;

        clearTimeout(this.timer);
        this.timer = undefined;
        this._timeout = false;
    }
}