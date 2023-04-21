
// // const module1 = new CWT_BK_04040202(2);

// // module1.connection.sub((val) => { console.log("Подключение: " + val) });
// // module1.AI1.get()


// // module1.subDI1((val) => console.log("DI1 = " + val));
// // module1.subDI2((val) => console.log("DI2 = " + val));
// // module1.subDI3((val) => console.log("DI3 = " + val));
// // module1.subDI4((val) => console.log("DI4 = " + val));

// // setInterval(() => {
// //   console.log("DI1 = " + module1.getDI1());
// //   console.log("DI2 = " + module1.getDI2());
// //   console.log("DI3 = " + module1.getDI3());
// //   console.log("DI4 = " + module1.getDI4());
// // });

// // module1.writeAO1(30, () => { console.log("AO1 записан") }); // 3 Вольта
// // module1.writeAO2(100, () => { console.log("AO2 записан") }); // 10 Вольт

// // module1.writeDO1(true, () => { console.log("DO1 записан") });
// // module1.writeDO2(true, () => { console.log("DO2 записан") });
// // module1.writeDO3(true, () => { console.log("DO3 записан") });
// // module1.writeDO4(true, () => { console.log("DO4 записан") });


// let DIRegs = [
//     // new Register(0, Access.Read, DataType.UINT16, TIORegisterType.DI),
//     // new Register(1, Access.Read, DataType.UINT16, TIORegisterType.DI),
//     // new Register(2, Access.Read, DataType.UINT16, TIORegisterType.DI),
//     new Register(3, Access.Read, DataType.UINT16, TIORegisterType.DI),
//   ];
//   // let DORegs = [
//   //   new Register(0, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO),
//   //   new Register(1, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO),
//   //   new Register(2, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO),
//   //   new Register(3, Access.ReadWrite, DataType.UINT16, TIORegisterType.DO),
//   // ];
//   let AIRegs = [
//     new Register(0, Access.Read, DataType.UINT16, TIORegisterType.AI),
//     new Register(1, Access.Read, DataType.UINT16, TIORegisterType.AI),
//   ];
//   let AORegs = [
//     new Register(0, Access.ReadWrite, DataType.UINT16, TIORegisterType.AO),
//     new Register(1, Access.ReadWrite, DataType.UINT16, TIORegisterType.AO),
//   ];
//   const device = new Device(1, [...DIRegs, ...AIRegs, ...AORegs]);
  
//   const modbus = new Server([device], "COM12", Rate.r9600, 1000);
  
//   // Класс для хранения состояния
//   // TODO: Надо переименовать
//   class Getter {
//     private observers: Array<() => number | boolean> = [];
//     constructor(observers: Array<() => number | boolean>) {
//       this.observers = observers;
//     }
//     public run() {
//       this.observers.forEach((observer) => {
//         observer();
//       });
//     }
//   }
  
//   let getter = new Getter([device.getDI0, device.getDI1]);
//   getter.run();
  
//   modbus.start();
  
//   // setTimeout(() => {
//   //   modbus.stop();
//   // }, 5000);
  