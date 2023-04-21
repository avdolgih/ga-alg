export default class Register {
  public readonly addr: number;
  public readonly access: Access;
  public readonly type: DataType;
  public readonly registerType: TIORegisterType;

  constructor(addr: number, access: Access, type: DataType, registerType: TIORegisterType) {
    this.addr = addr;
    this.access = access;
    this.type = type;
    this.registerType = registerType;
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
