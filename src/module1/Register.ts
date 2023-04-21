import Readable from "../observers/Readable";

export default class Register {
  readonly addr: number;
  readonly code: number;
  readonly val;

  constructor(addr: number, code: number, changed: (val: Buffer) => void) {
    this.addr = addr;
    this.code = code;
    this.val = new Readable<Buffer>();
    this.val.sub(changed);
  }

}
