import Module from "./Module";
import Port, { AnalogInput, AnalogOutput, DiscreteInput, DiscreteOutput } from "./Port";
import TreeComponent from "../utils/TreeComponent";

export default abstract class Register extends TreeComponent {
  public addr: number; // адрес
  public readLength: number = 0; // Количество битов для чтения

  protected parent!: Module;

  constructor(addr: number) {
    super();
    this.addr = addr;
  }

  abstract read(): Promise<boolean[] | number[]>;

  public setReadLength = () => {
    this.readLength = this.childs.length;
  };
}

export class DiscreteOutputRegister extends Register {
  childs: DiscreteOutput[] = [];
  // Чтение дискретного выхода
  public read = async () => {
    let res = await this.parent.FC1ReadCoils(this);

    this.childs.forEach((child, i) => {
      child.setValue(res[i]);
    });

    return res;
  };

  // Запись дискретного выхода
  public async write(value: boolean, port: DiscreteOutput) {
    const addr = this.childs.indexOf(port);
    console.log("REG", { value });
    let res = await this.parent.FC5writeCoil(addr, value);
    return res;
  }
}
export class DiscreteInputRegister extends Register {
  childs: DiscreteInput[] = [];

  // Чтение дискретного входа
  public read = async () => {
    let res: boolean[] = [];

    res = await this.parent.FC2readDiscreteInputs(this);
    this.childs.forEach((child, i) => {
      child.setValue(res[i]);
    });

    return res;
  };
}
export class AnalogOutputRegister extends Register {
  childs: AnalogOutput[] = [];
  // Чтение аналогового выхода
  public read = async () => {
    let res = await this.parent.FC3readHoldingRegisters(this);
    this.childs.forEach((child, i) => {
      child.setValue(res[i] / 1000);
    });
    return res;
  };

  // Запись аналогового выхода
  public async write(value: number, port: AnalogOutput) {
    const addr = this.childs.indexOf(port);
    console.log("REG", { value });
    let res = await this.parent.FC6writeRegister(addr, value);
    return res;
  }
}

export class AnalogInputRegister extends Register {
  childs: AnalogInput[] = [];
  // Чтение аналогового входа
  public read = async () => {
    let res = await this.parent.FC4readInputRegisters(this);
    this.childs.forEach((child, i) => {
      child.setValue(res[i]);
    });
    return res;
  };
}
