import CWT_BK_0404R_S from "../lib/extensionModules/CWT_BK_0404R_S";
import CWT_BK_0404T_SE from "../lib/extensionModules/CWT_BK_0404T_SE ";
import CWT_TM_2_PT1000 from "../lib/extensionModules/CWT_TM_2PT1000";
import ModbusServer from "../lib/modbus/ModbusServer";
import FDH2_inletDamper_fire from "../lib/systems/FDH2_inletDamper_fire";

// Определяем модули
let A2 = new CWT_TM_2_PT1000(1);
let A3 = new CWT_BK_0404T_SE(2);
let A4 = new CWT_BK_0404R_S(3);

// Определям серверы Modbus
let modbusCLI = new ModbusServer("", 9600);

// Определяем MQTT сервер

// Определяем алгоритмы
let alg = new FDH2_inletDamper_fire("П10", "П10Р");

// Соединяем модули с модбас сервером
A2.setParent(modbusCLI);
A3.setParent(modbusCLI);
A4.setParent(modbusCLI);

// Соединяем алгоритм с входами модулей
alg.inletTemperature.connectPort(A2.RTD1);
alg.diff1.connectPort(A3.DI1);
alg.diff2.connectPort(A3.DI2);
alg.diffFilter.connectPort(A3.DI3);
alg.supplyDamper0.connectPort(A3.DI4);
alg.supplyDamper1.connectPort(A4.DI1);
alg.supplyDamper2.connectPort(A4.DI2);
alg.thermalContact.connectPort(A4.DI3);
alg.fire.connectPort(A4.DI4);

// Соединяем алгоритм с выходами модулей
alg.electricHeaterStage1.connectPort(A3.DO1);
alg.damperActuatorInlet.connectPort(A3.DO2);
alg.damperActuator1.connectPort(A3.DO3);
alg.damperActuator2.connectPort(A4.DO4);
alg.runFan1.connectPort(A4.DO1);
alg.runFan2.connectPort(A4.DO2);
alg.electricHeaterStage2.connectPort(A4.DO3);

// Проверка соединения
