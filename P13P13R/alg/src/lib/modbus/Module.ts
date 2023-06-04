import ModbusServer from "./ModbusServer";
import Register, {
  AnalogInputRegister,
  AnalogOutputRegister,
  DiscreteInputRegister,
  DiscreteOutputRegister,
} from "./Register";
import TreeComponent from "../utils/TreeComponent";

export default class Module extends TreeComponent {
  readonly slaveID: number;
  protected parent!: ModbusServer;
  childs: Register[] = [];
  constructor(slaveID: number) {
    super();
    this.slaveID = slaveID;
  }

  public FC1ReadCoils = async (register: DiscreteOutputRegister) => {
    let res = await this.parent.FC1ReadCoils(this.slaveID, register.addr, register.readLength);
    return res;
  }; // Чтение дискретного выхода

  public FC5writeCoil = async (addr: number, value: boolean) => {
    let res = await this.parent.FC5writeCoil(this.slaveID, addr, value);
    return res;
  }; // Запись дискретного выхода

  public FC2readDiscreteInputs = async (register: DiscreteInputRegister) => {
    let res = await this.parent.FC2readDiscreteInputs(this.slaveID, register.addr, register.readLength);
    return res;
  }; // Чтение дискретного входа

  public FC3readHoldingRegisters = async (register: AnalogOutputRegister) => {
    let res = await this.parent.FC3readHoldingRegisters(this.slaveID, register.addr, register.readLength);
    return res;
  }; // Чтение аналогового выхода

  public FC6writeRegister = async (addr: number, value: number) => {
    let res = await this.parent.FC6writeRegister(this.slaveID, addr, value);
    return res;
  }; // Запись аналогового выхода

  public FC4readInputRegisters = async (register: AnalogInputRegister) => {
    let res = await this.parent.FC4readInputRegisters(this.slaveID, register.addr, register.readLength);
    return res;
  }; // Чтение аналогового входа
}
