import Device from "./Device";
import Register from "./Register";
import { Access, DataType, TIORegisterType } from "./Register";

export class CWT_BK_0404R_S extends Device {
  constructor(slaveID: number) {
    let addrDI = [0, 1, 2, 3];
    let addrDO = [0, 1, 2, 3];

    let DI = addrDI.map((addr) => {
      return new Register(addr, Access.Read, DataType.UINT16, TIORegisterType.DI);
    });

    let DO = addrDO.map((addr) => {
      return new Register(addr, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO);
    });
    super("CWT_BK_0404R_S", slaveID, [...DI, ...DO]);

    this.registers.forEach((reg) => {
      reg.attach(this);
    });
  }
}
