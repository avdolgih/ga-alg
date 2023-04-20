export default class Var<T> {

    private val?: T;
    private subscribers: Array<() => void> = [];

    constructor(val?: T) {
        this.val = val;
    }

    public set(val: T) {
        if (this.val == val)
            return;

        this.val = val;
        this.subscribers.forEach(s => s());
    }

    public get(): T | undefined {
        return this.val;
    }

    public subscribe(callback: () => void) {
        this.subscribers.push(callback)
    }
}