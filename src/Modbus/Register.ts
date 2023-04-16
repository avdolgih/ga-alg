export default class Register {
  public readonly addr: number;
  public readonly access: Access;
  public readonly type: Type;

  constructor(addr: number, access: Access, type: Type) {
    this.addr = addr;
    this.access = access;
    this.type = type;
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
