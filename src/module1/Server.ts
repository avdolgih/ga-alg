import Device from "./Device";
import ModbusRTU from "modbus-serial";
import Register from "./Register";

import { ReadCoilResult } from "modbus-serial/ModbusRTU";
import { ReadRegisterResult } from "modbus-serial/ModbusRTU";
import { WriteCoilResult } from "modbus-serial/ModbusRTU";
import { WriteMultipleResult } from "modbus-serial/ModbusRTU";
import { WriteRegisterResult } from "modbus-serial/ModbusRTU";
import Module from "./Module";

export default class Server {
  public readonly modules: Module[];
  private readonly client: ModbusRTU = new ModbusRTU();

  constructor(modules: Module[], port: string, rate: Rate) {
    this.modules = modules;
    this.client.connectRTU(port, { baudRate: rate }, () => { this.start() });
  }

  // private pooling: boolean = true;

  private async start() {
    console.log("Server Started");
    while (true) {
      for (let i = 0; i < this.modules.length; i++) {
        const modules = this.modules[i];
        for (let n = 0; n < modules.registers.length; n++) {
          const register = modules.registers[n];
          const result = await this.client.readDiscreteInputs(register.addr, 8);
          register.val.set(result.buffer);

          // if (device.registers[n].access === Access.Read || Access.ReadWrite) {
          //   await new Promise((resolve, reject) => {

          //     this.read(device.slaveID, device.registers[n]);
          //     resolve(null);
          //     // setTimeout(() => {

          //     // }, this.interval);
          //   });
          // }

          // if (!this.pooling) break;
        }
      }
    }
  }

  // public stop(): void {
  //   this.pooling = false;
  // }

  // // Чтение дискретных регистров
  // public async readCoil(slaveID: number, register: Register): Promise<ReadCoilResult | void> {
  //   this.client.setID(slaveID);
  //   let res: ReadCoilResult;
  //   if (register.registerType === "DO") {
  //     res = await this.client.readCoils(register.addr, 1);
  //     return res;
  //   }
  //   if (register.registerType === "DI") {
  //     res = await this.client.readDiscreteInputs(register.addr, 1);
  //     return res;
  //   }
  // }

  // // Чтение аналоговых регистров
  // public async readRegister(slaveID: number, register: Register): Promise<ReadRegisterResult | void> {
  //   this.client.setID(slaveID);
  //   let res: ReadRegisterResult;
  //   if (register.registerType === "AO") {
  //     res = await this.client.readHoldingRegisters(register.addr, 1);
  //     return res;
  //   }
  //   if (register.registerType === "AI") {
  //     res = await this.client.readInputRegisters(register.addr, 1);
  //     return res;
  //   }
  // }

  // // Запись одного дискретного регистра
  // public async writeSingleDO(register: Register, value: boolean): Promise<WriteCoilResult> {
  //   let res = await this.client.writeCoil(register.addr, value);
  //   return res;
  // }

  // // Запись несколько дискретных регистров
  // public async writeMultipleDO(register: Register, value: boolean[]): Promise<WriteMultipleResult> {
  //   let res = await this.client.writeCoils(register.addr, value);
  //   return res;
  // }

  // // Запись одного аналогового регистра
  // public async writeSingleAO(register: Register, value: number): Promise<WriteRegisterResult> {
  //   let res = await this.client.writeRegister(register.addr, value);
  //   return res;
  // }

  // // Запись нескольких аналоговых регистров
  // public async writeMultipleAO(register: Register, value: number[]): Promise<WriteMultipleResult> {
  //   let res = await this.client.writeRegisters(register.addr, value);
  //   return res;
  // }

  // // Функция чтения для сервера
  // private async read(slaveID: number, register: Register): Promise<ReadCoilResult | ReadRegisterResult | void> {
  //   this.client.setID(slaveID);
  //   let res;

  //   switch (register.registerType) {
  //     case "DO":
  //       console.log("Чтение", register.registerType, register.addr);

  //       res = await this.client.readCoils(register.addr, 1);
  //       console.log("Значение", { res });
  //       break;
  //     case "DI":
  //       console.log("Чтение", register.registerType, register.addr);
  //       res = await this.client.readDiscreteInputs(register.addr, 1);
  //       console.log("Значение", { res });
  //       break;
  //     case "AO":
  //       console.log("Чтение", register.registerType, register.addr);
  //       res = await this.client.readHoldingRegisters(register.addr, 1);
  //       console.log("Значение", { res });
  //       break;
  //     case "AI":
  //       console.log("Чтение", register.registerType, register.addr);
  //       res = await this.client.readInputRegisters(register.addr, 1);
  //       console.log("Значение", { res });
  //       break;

  //     default:
  //       break;
  //   }

  //   console.log("________________________");

  //   return res;
  // }
}

export enum Rate {
  r9600 = 9600,
  r19200 = 19200,
  r115200 = 115200
}
