import IRegister from "./Register";

export default class Device {
  public readonly slaveID: number;

  public readonly registers: IRegister[];

  constructor(registers: IRegister[], slaveID: number) {
    this.registers = registers;
    this.slaveID = slaveID;
  }
}
