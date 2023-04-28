import Module from "../modbus/Module";
import { AnalogInput, AnalogOutput } from "../modbus/Port";
import { AnalogInputRegister, DiscreteInputRegister } from "../modbus/Register";

export default class CWT_TM_2_PT1000 extends Module {
  constructor(slaveID: number) {
    super(slaveID);

    // Устанавливаем зависимости

    this.AIReg1.setParent(this);
    this.AIreg2.setParent(this);
    this.AIreg3.setParent(this);
    this.AIreg4.setParent(this);

    this.RTD1.setParent(this.AIReg1);
    this.RTD2.setParent(this.AIreg2);
    this.RTD3.setParent(this.AIreg3);
    this.RTD4.setParent(this.AIreg4);

    // Определяем длину чтения регистров
    this.childs.forEach((child) => {
      child.setReadLength;
    });
  }
  // Определяем регистры

  public AIReg1 = new AnalogInputRegister(40);
  public AIreg2 = new AnalogInputRegister(42);
  public AIreg3 = new AnalogInputRegister(20);
  public AIreg4 = new AnalogInputRegister(21);

  //   Определяем порты
  public RTD1 = new AnalogInput();
  public RTD2 = new AnalogInput();
  public RTD3 = new AnalogInput();
  public RTD4 = new AnalogInput();
}
