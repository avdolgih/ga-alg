import IReadable from "./IReadable"

export default interface IWritable<T> extends IReadable<T> {
    set(val: T): void
}