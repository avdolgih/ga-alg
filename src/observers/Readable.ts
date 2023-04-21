import IReadable from "./IReadable";

export default class Readable<T> implements IReadable<T> {

    private readonly onChange?: () => void;
    private val: T | undefined;
    private readonly subscribers: Array<(val: T) => void> = [];

    constructor(onChange?: () => void) {
        if (onChange)
            this.onChange = onChange;
    }

    get isActive(): boolean {
        return this.subscribers.length > 0;
    }

    sub(callback: (val: T) => void) {
        this.subscribers.push(callback);
        if (this.onChange && this.subscribers.length == 1)
            this.onChange();
    }

    get(): T | undefined {
        return this.val;
    }

    set(val: T) {
        if (this.val == val)
            return;
        this.val = val;
        this.subscribers.forEach((sub) => { sub(val) });
    }
}