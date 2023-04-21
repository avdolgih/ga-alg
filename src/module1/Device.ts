import IRegister from "./Register";

export default class Device {
  public readonly slaveID: number;
  public readonly registers: IRegister[];
  constructor(slaveID: number, registers: IRegister[]) {
    this.slaveID = slaveID;
    this.registers = registers;
  }

  public getDI0() {
    return false;
  }
  public getDI1() {
    return false;
  }
  public getDI2() {
    return false;
  }
  public getDI3() {
    return false;
  }

  public getDO0() {
    console.log("DO0");
    return false;
  }
  public getDO1() {
    console.log("DO1");
    return false;
  }
  public getDO2() {
    console.log("DO2");
    return false;
  }
  public getDO3() {
    console.log("DO3");
    return false;
  }

  public setDO0() {}
  public setDO1() {}
  public setDO2() {}
  public setDO3() {}

  public getAO0() {}
  public getAO1() {}

  public getAI0() {}
  public getAI1() {}

  public setAI0() {}
  public setAI1() {}
}
