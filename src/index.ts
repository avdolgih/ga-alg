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
const divice = new Device(1, [...DIRegs, ...DORegs, ...AIRegs, ...AORegs]);

const modbus = new Server([divice], "COM4", Rate.r9600, 1000);

modbus.start();

// setTimeout(() => {
//   modbus.stop();
// }, 5000);
