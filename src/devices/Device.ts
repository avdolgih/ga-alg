import IRegister from "./Register";

export default class Device {
  public readonly slaveID: number;
  public readonly registers: IRegister[];
  constructor(slaveID: number, registers: IRegister[]) {
    this.slaveID = slaveID;
    this.registers = registers;
  }
}
