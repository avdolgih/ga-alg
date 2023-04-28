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

  public async FC1ReadCoils(register: DiscreteOutputRegister) {
    let res = await this.parent.FC1ReadCoils(this.slaveID, register.addr, register.readLength);
    return res;
  } // Чтение дискретного выхода

  public async FC5writeCoil(register: DiscreteOutputRegister, value: boolean) {
    let res = await this.parent.FC5writeCoil(this.slaveID, register.addr, value);
    return res;
  } // Запись дискретного выхода

  public async FC2readDiscreteInputs(register: DiscreteInputRegister) {
    let res = await this.parent.FC2readDiscreteInputs(this.slaveID, register.addr, register.readLength);
    return res;
  } // Чтение дискретного входа

  public async FC3readHoldingRegisters(register: AnalogOutputRegister) {
    let res = await this.parent.FC3readHoldingRegisters(this.slaveID, register.addr, register.readLength);
    return res;
  } // Чтение аналогового выхода

  public async FC6writeRegister(register: AnalogOutputRegister, value: number) {
    let res = await this.parent.FC6writeRegister(this.slaveID, register.addr, value);
    return res;
  } // Запись аналогового выхода

  public async FC4readInputRegisters(register: AnalogInputRegister) {
    let res = await this.parent.FC4readInputRegisters(this.slaveID, register.addr, register.readLength);
    return res;
  } // Чтение аналогового входа
}
