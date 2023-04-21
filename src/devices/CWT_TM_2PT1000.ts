import Device from "./Device";
import Register from "./Register";
import { Access, DataType, TIORegisterType } from "./Register";

export class CWT_TM_2PT1000 extends Device {
  constructor(slaveID: number) {
    let RTD1 = new Register(1, Access.Read, DataType.UINT16, TIORegisterType.AI, "AI0");
    let RTD2 = new Register(2, Access.Read, DataType.UINT16, TIORegisterType.AI, "AI1");

    super("CWT_TM_2PT1000", slaveID, [RTD1, RTD2]);

    this.registers.forEach((reg) => {
      reg.attach(this);
    });
  }
}
