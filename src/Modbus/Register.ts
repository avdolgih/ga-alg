export default class Register {
  public readonly addr: number;
  public readonly access: Access;
  public readonly type: Type;
  public readonly registerType: TRegisterType;

  constructor(addr: number, access: Access, type: Type, registerType: TRegisterType) {
    this.addr = addr;
    this.access = access;
    this.type = type;
    this.registerType = registerType;
  }
}

export enum Access {
  "ReadWrite" = "ReadWrite",
  "Read" = "Read",
  "Write" = "Write",
}

export enum Type {
  "UINT16" = "UINT16",
}

export enum TRegisterType {
  DI = "DI",
  DO = "DO",
  AI = "AI",
  AO = "AO",
}
