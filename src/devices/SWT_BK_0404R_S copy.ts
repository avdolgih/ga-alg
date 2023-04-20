import Device from "../Modbus/Device";
import Register, { Access, TRegisterType, Type } from "../Modbus/Register";

let addrDI = [0, 1, 2, 3];
let addrDO = [0, 1, 2, 3];

let DI = addrDI.map((addr) => {
  return new Register(addr, Access.Read, Type.UINT16, TRegisterType.DI);
});

let DO = addrDO.map((addr) => {
  return new Register(addr, Access.ReadWrite, Type.UINT16, TRegisterType.DI);
});

let SWT_BK_0404R_S_2 = new Device([...DI, ...DO], 2);

export default SWT_BK_0404R_S_2;
