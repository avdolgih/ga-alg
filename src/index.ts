import Server, { Rate } from "./module1/Server";
import CWT_BK_04040202 from "./module1/CWT_BK_04040202";


const module1 = new CWT_BK_04040202(1);
const server = new Server([module1], 'COM4', Rate.r9600);

// module1.connection.sub((val) => { console.log("Подключение: " + val) });
module1.DI1.sub((val) => console.log("DI1 = " + val));
module1.DI2.sub((val) => console.log("DI2 = " + val));
module1.DI3.sub((val) => console.log("DI3 = " + val));
module1.DI4.sub((val) => console.log("DI4 = " + val));
