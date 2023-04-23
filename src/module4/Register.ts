import Module from "./Module";
import { AnalogInput, AnalogOutput, DiscreteInput, DiscreteOutput } from "./Port";
import TreeComponent from "./TreeComponent";

export default abstract class Register extends TreeComponent {
  public addr: number; // адрес
  public readLength: number; // Количество битов для чтения

  protected parent!: Module;

  constructor(addr: number, readLength: number) {
    super();
    this.addr = addr;
    this.readLength = readLength;
  }

  abstract read(): Promise<boolean[] | number[]>;
}

export class DiscreteOutputRegister extends Register {
  modules: DiscreteOutput[] = [];
  // Чтение дискретного выхода
  public async read() {
    let res = await this.parent.FC1ReadCoils(this);
    return res;
  }

  // Запись дискретного выхода
  public async write(value: boolean) {
    let res = await this.parent.FC5writeCoil(this, value);
    return res;
  }
}
export class DiscreteInputRegister extends Register {
  modules: DiscreteInput[] = [];
  // Чтение дискретного входа
  public async read() {
    let res = await this.parent.FC2readDiscreteInputs(this);
    return res;
  }
}
export class AnalogOutputRegister extends Register {
  modules: AnalogOutput[] = [];
  // Чтение аналогового выхода
  public async read() {
    let res = await this.parent.FC3readHoldingRegisters(this);
    return res;
  }

  // Запись аналогового выхода
  public async write(value: number) {
    let res = await this.parent.FC6writeRegister(this, value);
    return res;
  }
}

export class AnalogInputRegister extends Register {
  modules: AnalogInput[] = [];
  // Чтение аналогового входа
  public async read() {
    let res = await this.parent.FC4readInputRegisters(this);
    this.modules.forEach((child) => {
      child.setValue(res[0]);
    });
    return res;
  }
}
