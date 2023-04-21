import Device from "../devices/Device";
import ModbusRTU from "modbus-serial";
import Register, { Access } from "../devices/Register";

import { ReadCoilResult } from "modbus-serial/ModbusRTU";
import { ReadRegisterResult } from "modbus-serial/ModbusRTU";
import { WriteCoilResult } from "modbus-serial/ModbusRTU";
import { WriteMultipleResult } from "modbus-serial/ModbusRTU";
import { WriteRegisterResult } from "modbus-serial/ModbusRTU";

export default class Server {
  public readonly devices: Device[];
  private readonly client: ModbusRTU = new ModbusRTU();
  private interval: number;

  constructor(devices: Device[], port: string, rate: Rate, interval: number) {
    this.interval = interval;
    this.devices = devices;
    // this.client.connectRTUBuffered(port, { baudRate: rate });
  }

  private pooling: boolean = true;

  public async start(): Promise<void> {
    while (true) {
      for (let i = 0; i < this.devices.length; i++) {
        let device = this.devices[i];
        for (let n = 0; n < device.registers.length; n++) {
          if (!this.pooling) break;
          if (device.registers[n].access === Access.Read || Access.ReadWrite) {
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                this.read(device.slaveID, device.registers[n]);
                resolve(null);
              }, this.interval);
            });
          }
        }
      }
    }
  }

  public stop(): void {
    console.log("STOP");
    this.pooling = false;
  }

  // Чтение дискретных регистров
  public async readCoil(slaveID: number, register: Register): Promise<ReadCoilResult | void> {
    this.client.setID(slaveID);
    let res: ReadCoilResult;
    if (register.registerType === "DO") {
      res = await this.client.readCoils(register.addr, 1);
      return res;
    }
    if (register.registerType === "DI") {
      res = await this.client.readDiscreteInputs(register.addr, 1);
      return res;
    }
  }

  // Чтение аналоговых регистров
  public async readRegister(slaveID: number, register: Register): Promise<ReadRegisterResult | void> {
    this.client.setID(slaveID);
    let res: ReadRegisterResult;
    if (register.registerType === "AO") {
      res = await this.client.readHoldingRegisters(register.addr, 1);
      return res;
    }
    if (register.registerType === "AI") {
      res = await this.client.readInputRegisters(register.addr, 1);
      return res;
    }
  }

  // Запись одного дискретного регистра
  public async writeSingleDO(register: Register, value: boolean): Promise<WriteCoilResult> {
    let res = await this.client.writeCoil(register.addr, value);
    return res;
  }

  // Запись несколько дискретных регистров
  public async writeMultipleDO(register: Register, value: boolean[]): Promise<WriteMultipleResult> {
    let res = await this.client.writeCoils(register.addr, value);
    return res;
  }

  // Запись одного аналогового регистра
  public async writeSingleAO(register: Register, value: number): Promise<WriteRegisterResult> {
    let res = await this.client.writeRegister(register.addr, value);
    return res;
  }

  // Запись нескольких аналоговых регистров
  public async writeMultipleAO(register: Register, value: number[]): Promise<WriteMultipleResult> {
    let res = await this.client.writeRegisters(register.addr, value);
    return res;
  }

  // Функция чтения для сервера
  private async read(slaveID: number, register: Register): Promise<ReadCoilResult | ReadRegisterResult | void> {
    this.client.setID(slaveID);
    let res;

    switch (register.registerType) {
      case "DO":
        console.log("Чтение", register.registerType, register.addr);
        res = await this.client.readCoils(register.addr, 1);
        break;
      case "DI":
        console.log("Чтение", register.registerType, register.addr);
        res = await this.client.readDiscreteInputs(register.addr, 1);
        break;
      case "AO":
        console.log("Чтение", register.registerType, register.addr);
        res = await this.client.readHoldingRegisters(register.addr, 1);
        break;
      case "AI":
        console.log("Чтение", register.registerType, register.addr);
        res = await this.client.readInputRegisters(register.addr, 1);
        break;

      default:
        break;
    }
    console.log("Значение", { res });
    console.log("________________________");

    return res;
  }
}

export enum Rate {
  r9600 = 9600,
  r19200 = 19200,
  r115200 = 115200,
}

type TReg = {
  reg: Register;
  slaveID: number;
};
