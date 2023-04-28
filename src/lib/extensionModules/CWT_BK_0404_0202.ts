import Module from "../modbus/Module";
import { AnalogInput, AnalogOutput, DiscreteInput, DiscreteOutput } from "../modbus/Port";
import Register, { DiscreteInputRegister, DiscreteOutputRegister } from "../modbus/Register";

export default class CWT_BK_04040202 extends Module {
  constructor(slaveID: number) {
    super(slaveID);

    // Устанавливаем зависимости
    this.DIReg.setParent(this);
    this.DOReg.setParent(this);
    this.AIReg.setParent(this);
    this.AOReg.setParent(this);

    this.DI1.setParent(this.DIReg);
    this.DI2.setParent(this.DIReg);
    this.DI3.setParent(this.DIReg);
    this.DI4.setParent(this.DIReg);

    this.DO1.setParent(this.DOReg);
    this.DO2.setParent(this.DOReg);
    this.DO3.setParent(this.DOReg);
    this.DO4.setParent(this.DOReg);

    this.AO1.setParent(this.AOReg);
    this.AO2.setParent(this.AOReg);

    this.AI1.setParent(this.AIReg);
    this.AI2.setParent(this.AIReg);

    // Определяем длину чтения регистров
    this.childs.forEach((child) => {
      child.setReadLength;
    });
  }
  // Определяем регистры
  public DIReg = new DiscreteInputRegister(0);
  public DOReg = new DiscreteOutputRegister(0);
  public AIReg = new DiscreteInputRegister(0);
  public AOReg = new DiscreteOutputRegister(0);

  // Определяем входы-выходы
  public DI1 = new DiscreteInput();
  public DI2 = new DiscreteInput();
  public DI3 = new DiscreteInput();
  public DI4 = new DiscreteInput();

  public DO1 = new DiscreteOutput();
  public DO2 = new DiscreteOutput();
  public DO3 = new DiscreteOutput();
  public DO4 = new DiscreteOutput();

  public AO1 = new AnalogOutput();
  public AO2 = new AnalogOutput();

  public AI1 = new AnalogInput();
  public AI2 = new AnalogInput();
}
