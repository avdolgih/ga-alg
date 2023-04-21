import Server, { Rate } from "./Modbus/Server";
import Device from "./devices/Device";
import Register, { Access, DataType, TIORegisterType } from "./devices/Register";

let DIRegs = [
  new Register(0, Access.Read, DataType.UINT16, TIORegisterType.DI),
  new Register(1, Access.Read, DataType.UINT16, TIORegisterType.DI),
  new Register(2, Access.Read, DataType.UINT16, TIORegisterType.DI),
  new Register(3, Access.Read, DataType.UINT16, TIORegisterType.DI),
];
let DORegs = [
  new Register(0, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO),
  new Register(1, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO),
  new Register(2, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO),
  new Register(3, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO),
];
let AIRegs = [
  new Register(0, Access.Read, DataType.UINT16, TIORegisterType.AI),
  new Register(1, Access.Read, DataType.UINT16, TIORegisterType.AI),
];
let AORegs = [
  new Register(0, Access.ReadWrite, DataType.UINT16, TIORegisterType.AO),
  new Register(1, Access.ReadWrite, DataType.UINT16, TIORegisterType.AO),
];
const device = new Device(1, [...DIRegs, ...DORegs, ...AIRegs, ...AORegs]);

const modbus = new Server([device], "COM4", Rate.r9600, 1000);

// Класс для хранения состояния
// TODO: Надо переименовать
class Getter {
  private observers: Array<() => number | boolean> = [];
  constructor(observers: Array<() => number | boolean>) {
    this.observers = observers;
  }
  public run() {
    this.observers.forEach((observer) => {
      observer();
    });
  }
}

let getter = new Getter([device.getDI0, device.getDI1]);
getter.run();

// modbus.start();

// setTimeout(() => {
//   modbus.stop();
// }, 5000);
