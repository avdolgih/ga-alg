import Module from "../modbus/Module";
import { DiscreteInput, DiscreteOutput } from "../modbus/Port";
import { DiscreteInputRegister, DiscreteOutputRegister } from "../modbus/Register";

export default class CWT_BK_0808R_S extends Module {
  constructor(slaveID: number) {
    super(slaveID);

    // Устанавливаем зависимости
    this.DIReg.setParent(this);
    this.DO1Reg.setParent(this);
    this.DO2Reg.setParent(this);
    this.DO3Reg.setParent(this);
    this.DO4Reg.setParent(this);
    this.DO5Reg.setParent(this);
    this.DO6Reg.setParent(this);
    this.DO7Reg.setParent(this);
    this.DO8Reg.setParent(this);

    this.DI1.setParent(this.DIReg);
    this.DI2.setParent(this.DIReg);
    this.DI3.setParent(this.DIReg);
    this.DI4.setParent(this.DIReg);
    this.DI5.setParent(this.DIReg);
    this.DI6.setParent(this.DIReg);
    this.DI7.setParent(this.DIReg);
    this.DI8.setParent(this.DIReg);

    this.DO1.setParent(this.DO1Reg);
    this.DO2.setParent(this.DO2Reg);
    this.DO3.setParent(this.DO3Reg);
    this.DO4.setParent(this.DO4Reg);
    this.DO5.setParent(this.DO5Reg);
    this.DO6.setParent(this.DO6Reg);
    this.DO7.setParent(this.DO7Reg);
    this.DO8.setParent(this.DO8Reg);

    // Определяем длину чтения регистров
    this.childs.forEach((child) => {
      child.setReadLength();
    });
  }
  // Определяем регистры
  public DIReg = new DiscreteInputRegister(0);

  public DO1Reg = new DiscreteOutputRegister(0);
  public DO2Reg = new DiscreteOutputRegister(1);
  public DO3Reg = new DiscreteOutputRegister(2);
  public DO4Reg = new DiscreteOutputRegister(3);
  public DO5Reg = new DiscreteOutputRegister(4);
  public DO6Reg = new DiscreteOutputRegister(5);
  public DO7Reg = new DiscreteOutputRegister(6);
  public DO8Reg = new DiscreteOutputRegister(7);

  // Определяем входы-выходы
  public DI1 = new DiscreteInput();
  public DI2 = new DiscreteInput();
  public DI3 = new DiscreteInput();
  public DI4 = new DiscreteInput();
  public DI5 = new DiscreteInput();
  public DI6 = new DiscreteInput();
  public DI7 = new DiscreteInput();
  public DI8 = new DiscreteInput();

  public DO1 = new DiscreteOutput();
  public DO2 = new DiscreteOutput();
  public DO3 = new DiscreteOutput();
  public DO4 = new DiscreteOutput();
  public DO5 = new DiscreteOutput();
  public DO6 = new DiscreteOutput();
  public DO7 = new DiscreteOutput();
  public DO8 = new DiscreteOutput();
}
