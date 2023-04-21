import Device from "./Device";

export default class Register {
  public readonly addr: number;
  public readonly access: Access;
  public readonly type: DataType;
  public readonly registerType: TIORegisterType;
  private _value: number = 0;
  public name: string;
  private subscriber?: Device;
  public isActive: boolean = true;

  constructor(addr: number, access: Access, type: DataType, registerType: TIORegisterType, name?: string) {
    this.addr = addr;
    this.access = access;
    this.type = type;
    this.registerType = registerType;
    this.name = name || `${registerType}${addr}`;
  }

  public set value(val: number) {
    if (this.isActive) {
      this._value = val;
      this.notify(this._value);
    }
  }

  public get value(): number {
    return this._value;
  }

  public attach(observer: Device): void {
    this.subscriber = observer;
  }

  public notify(value: number) {
    this.subscriber && this.subscriber.update(value, this.name);
  }
}

export enum Access {
  ReadWrite = "ReadWrite",
  Read = "Read",
  Write = "Write",
}

export enum DataType {
  UINT16 = "UINT16",
}

export enum TIORegisterType {
  DI = "DI",
  DO = "DO",
  AI = "AI",
  AO = "AO",
}
