import ModbusRTU from "modbus-serial";
import Module from "./Module";
import TreeComponent from "../utils/TreeComponent";

export default class ModbusServer extends TreeComponent {
  childs: Module[] = [];
  private client: ModbusRTU = new ModbusRTU();
  constructor(port: string, baudRate: number) {
    super();
    // this.client.connectRTU(port, { baudRate });
    this.client.setTimeout(500);
  }

  // Запуск опроса регистров
  public async start() {
    while (true) {
      new Promise((resolve) => {
        this.childs.forEach((module) => {
          module.childs.forEach((child) => {
            child.read();
            resolve(null);
          });
        });
      });
    }
  }

  // Функции чтения
  public async FC1ReadCoils(slaveID: number, addr: number, len: number): Promise<boolean[]> {
    this.client.setID(slaveID);
    let res = await this.client.readCoils(addr, len);
    return res.data;
  }
  public async FC2readDiscreteInputs(slaveID: number, addr: number, arg: number): Promise<boolean[]> {
    this.client.setID(slaveID);
    let res = await this.client.readDiscreteInputs(addr, arg);
    return res.data;
  }
  public async FC3readHoldingRegisters(slaveID: number, addr: number, len: number): Promise<number[]> {
    this.client.setID(slaveID);
    let res = await this.client.readHoldingRegisters(addr, len);
    return res.data;
  }
  public async FC4readInputRegisters(slaveID: number, addr: number, len: number): Promise<number[]> {
    this.client.setID(slaveID);
    let res = await this.client.readInputRegisters(addr, len);
    return res.data;
  }

  // Функции записи
  public async FC5writeCoil(slaveID: number, addr: number, binary: boolean) {
    this.client.setID(slaveID);
    let res = await this.client.writeCoil(addr, binary);
    return res.state;
  }
  public async FC6writeRegister(slaveID: number, addr: number, value: number) {
    this.client.setID(slaveID);
    let res = await this.client.writeRegister(addr, value);
    return res.value;
  }
  public async FC15writeCoils(slaveID: number, addr: number, valueAry: boolean[]) {
    this.client.setID(slaveID);
    let res = await this.client.writeCoils(addr, valueAry);
    return res.length;
  }
  public async FC16writeRegisters(slaveID: number, addr: number, valueAry: number[]) {
    this.client.setID(slaveID);
    let res = await this.client.writeRegisters(addr, valueAry);
    return res.length;
  }
}
