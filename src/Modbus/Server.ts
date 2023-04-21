import Device from "../devices/Device";
import ModbusRTU from "modbus-serial";
import Register, { Access } from "../devices/Register";

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

  public stop(): void {
    console.log("STOP");
    this.pooling = false;
  }

  private async read(slaveID: number, register: Register): Promise<number> {
    this.client.setID(slaveID);
    let res;

    switch (register.registerType) {
      case "DO":
        console.log("Чтение", register.registerType, register.addr);
        // res = await this.client.readCoils(register.addr, 1);
        break;
      case "DI":
        console.log("Чтение", register.registerType, register.addr);
        // res = await this.client.readDiscreteInputs(register.addr, 1);
        break;
      case "AO":
        console.log("Чтение", register.registerType, register.addr);
        // res = await this.client.readHoldingRegisters(register.addr, 1);
        break;
      case "AI":
        console.log("Чтение", register.registerType, register.addr);
        // res = await this.client.readInputRegisters(register.addr, 1);
        break;

      default:
        break;
    }
    console.log({ res });

    return 0;
  }

  private async write(addr: number, val: number) {
    // Запись одного DO Force Single Coil
    // Запись одного AO Preset Single Register
    // Запись нескольких DO Force Multiple Coils
    // Запись нескольких AO Preset Multiple Registers
    console.log("Write");
    return null;
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
