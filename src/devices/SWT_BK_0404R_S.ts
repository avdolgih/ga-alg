import Device from "../Modbus/Device";
import Register, { Access, TRegisterType, Type } from "../Modbus/Register";

let addrDI = [0, 1, 2, 3];
let addrDO = [0, 1, 2, 3];

let DI = addrDI.map((addr) => {
  return new Register(addr, Access.Read, Type.UINT16, TRegisterType.DI);
});

let DO = addrDO.map((addr) => {
  return new Register(addr, Access.ReadWrite, Type.UINT16, TRegisterType.DO);
});

let SWT_BK_0404R_S = new Device([...DI, ...DO], 1);

export default SWT_BK_0404R_S;
