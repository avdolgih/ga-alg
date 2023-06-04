import Module from "../modbus/Module";
import { DiscreteInput, DiscreteOutput } from "../modbus/Port";
import { DiscreteInputRegister, DiscreteOutputRegister } from "../modbus/Register";

export default class CWT_BK_0404T_SE extends Module {
  constructor(slaveID: number) {
    super(slaveID);

    // Устанавливаем зависимости
    this.DIReg.setParent(this);
    this.AIReg.setParent(this);

    this.DOReg0.setParent(this);
    this.DOReg1.setParent(this);
    this.DOReg2.setParent(this);
    this.DOReg3.setParent(this);

    this.DI1.setParent(this.DIReg);
    this.DI2.setParent(this.DIReg);
    this.DI3.setParent(this.DIReg);
    this.DI4.setParent(this.DIReg);

    this.DO1.setParent(this.DOReg0);
    this.DO2.setParent(this.DOReg1);
    this.DO3.setParent(this.DOReg2);
    this.DO4.setParent(this.DOReg3);

    // Определяем длину чтения регистров
    this.childs.forEach((child) => {
      child.setReadLength();
    });
  }
  // Определяем регистры
  public DIReg = new DiscreteInputRegister(0);
  public AIReg = new DiscreteInputRegister(0);

  public DOReg0 = new DiscreteOutputRegister(0);
  public DOReg1 = new DiscreteOutputRegister(1);
  public DOReg2 = new DiscreteOutputRegister(2);
  public DOReg3 = new DiscreteOutputRegister(3);

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
