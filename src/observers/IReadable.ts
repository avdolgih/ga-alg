export default interface IReadable<T> {
    sub(callback: (val: T) => void) : void
    get(): T | undefined
}