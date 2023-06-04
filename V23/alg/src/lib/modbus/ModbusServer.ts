import ModbusRTU from "modbus-serial";
import Module from "./Module";
import TreeComponent from "../utils/TreeComponent";
import { WriteCoilResult } from "modbus-serial/ModbusRTU";

export default class ModbusServer extends TreeComponent {
  childs: Module[] = [];
  private client: ModbusRTU = new ModbusRTU();
  private port: string;
  private baudRate: number;
  constructor(port: string, baudRate: number) {
    super();
    this.baudRate = baudRate;
    this.port = port;

    this.client.setTimeout(5000);
  }

  private slaveID: number = 0;

  public pooling: boolean = true;
  public writeReady: boolean = false;

  public async createConnection() {
    await this.client.connectRTU(this.port, { baudRate: this.baudRate });
    console.log("Connected");
  }

  // Запуск опроса регистров
  public async start() {
    while (true) {
      for (let i = 0; i < this.childs.length; i++) {
        let module = this.childs[i];
        for (let j = 0; j < module.childs.length; j++) {
          if (this.pooling) {
            this.writeReady = false;

            await new Promise(async (resolve) => {
              await module.childs[j].read();
              setTimeout(() => {
                resolve(null);
              }, 150);
            });
          } else {
            this.writeReady = true;
          }
        }
      }
    }
  }

  public async healthCheck() {
    console.log("________HEALTHCHECK__________");

    for (let i = 0; i < this.childs.length; i++) {
      let module = this.childs[i];
      for (let j = 0; j < module.childs.length; j++) {
        await module.childs[j].read();
      }
    }
  }

  // Функции чтения
  public FC1ReadCoils = async (slaveID: number, addr: number, len: number): Promise<boolean[]> => {
    try {
      if (this.slaveID != slaveID) {
        await this.client.setID(slaveID);
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 150);
        });
      }

      let res = await this.client.readCoils(addr, len);

      if (res != undefined) {
        return res.data;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log({ error });
      process.exit();
    }
  };
  public FC2readDiscreteInputs = async (slaveID: number, addr: number, arg: number): Promise<boolean[]> => {
    try {
      if (this.slaveID != slaveID) {
        await this.client.setID(slaveID);
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 150);
        });
      }

      let res = await this.client.readDiscreteInputs(addr, 8);

      if (res != undefined) {
        return res.data;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log({ error });
      process.exit();
    }
  };
  public FC3readHoldingRegisters = async (slaveID: number, addr: number, len: number): Promise<number[]> => {
    try {
      if (this.slaveID != slaveID) {
        await this.client.setID(slaveID);
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 150);
        });
      }

      let res = await this.client.readHoldingRegisters(addr, len);

      if (res != undefined) {
        return res.data;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log({ error });
      process.exit();
    }
  };
  public FC4readInputRegisters = async (slaveID: number, addr: number, len: number): Promise<number[]> => {
    try {
      this.client.setID(slaveID);

      let res = await this.client.readInputRegisters(addr, len);

      if (res != undefined) {
        return res.data;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log({ error });
      process.exit();
    }
  };

  // Функции записи
  public FC5writeCoil = async (slaveID: number, addr: number, binary: boolean) => {
    try {
      console.log({ slaveID, addr, binary });
      this.client.setID(slaveID);

      console.log("Остановка чтения");
      this.pooling = false;

      let timer: NodeJS.Timeout;
      let interval: NodeJS.Timer;

      let promise = await new Promise((resolve) => {
        console.log("Ожидаем разрешения на запись");

        interval = setInterval(() => {
          console.log(this.writeReady);
          if (this.writeReady) {
            clearInterval(interval);
            clearTimeout(timer);
          }
        }, 1000);

        // timer = setTimeout(() => {
        //   console.log("RESOLVE");
        //   clearInterval(interval);
        //   resolve(null);
        // }, 3000);

        console.log(!this.writeReady);

        resolve(null);
      });

      console.log("Запись");
      let res: WriteCoilResult;
      res = await this.client.writeCoil(addr, binary);

      this.pooling = true;

      console.log("Запись прошла успешно, продолжаем");
      if (res != undefined) {
        return res.state;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log({ error });
      process.exit();
    }
  };
  public FC6writeRegister = async (slaveID: number, addr: number, value: number) => {
    try {
      console.log({ slaveID, addr, value });
      this.pooling = false;

      this.client.setID(slaveID);

      let res = await this.client.writeRegister(addr, value);
      this.pooling = true;
      if (res != undefined) {
        return res.value;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log({ error });
      process.exit();
    }
  };
  public FC15writeCoils = async (slaveID: number, addr: number, valueAry: boolean[]) => {
    try {
      console.log({ slaveID, addr, valueAry });
      this.pooling = false;

      this.client.setID(slaveID);

      let res = await this.client.writeCoils(addr, valueAry);
      this.pooling = true;
      if (res != undefined) {
        return res.length;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log({ error });
      process.exit();
    }
  };
  public FC16writeRegisters = async (slaveID: number, addr: number, valueAry: number[]) => {
    try {
      console.log({ slaveID, addr, valueAry });
      this.pooling = false;

      this.client.setID(slaveID);

      let res = await this.client.writeRegisters(addr, valueAry);
      this.pooling = true;
      if (res != undefined) {
        return res.length;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log({ error });
      process.exit();
    }
  };
}
