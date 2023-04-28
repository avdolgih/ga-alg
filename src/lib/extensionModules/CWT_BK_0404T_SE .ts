import Module from "../modbus/Module";
import { DiscreteInput, DiscreteOutput } from "../modbus/Port";
import { DiscreteInputRegister, DiscreteOutputRegister } from "../modbus/Register";

export default class CWT_BK_0404T_SE extends Module {
  constructor(slaveID: number) {
    super(slaveID);

    // Устанавливаем зависимости
    this.DIReg.setParent(this);
    this.DOReg.setParent(this);

    this.DI1.setParent(this.DIReg);
    this.DI2.setParent(this.DIReg);
    this.DI3.setParent(this.DIReg);
    this.DI4.setParent(this.DIReg);

    this.DO1.setParent(this.DOReg);
    this.DO2.setParent(this.DOReg);
    this.DO3.setParent(this.DOReg);
    this.DO4.setParent(this.DOReg);

    // Определяем длину чтения регистров
    this.childs.forEach((child) => {
      child.setReadLength;
    });
  }
  // Определяем регистры
  public DIReg = new DiscreteInputRegister(0);
  public DOReg = new DiscreteOutputRegister(0);

  // Определяем входы-выходы
  public DI1 = new DiscreteInput();
  public DI2 = new DiscreteInput();
  public DI3 = new DiscreteInput();
  public DI4 = new DiscreteInput();

  public DO1 = new DiscreteOutput();
  public DO2 = new DiscreteOutput();
  public DO3 = new DiscreteOutput();
  public DO4 = new DiscreteOutput();
}
