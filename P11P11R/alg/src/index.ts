import CWT_BK_0404R_S from "./lib/extensionModules/CWT_BK_0404R_S";
import ModbusServer from "./lib/modbus/ModbusServer";
import * as mqtt from "mqtt";
import EventBus from "./lib/utils/EventBus";
import CWT_TM_2_PT1000 from "./lib/extensionModules/CWT_TM_2PT1000";
import CWT_BK_0404T_SE from "./lib/extensionModules/CWT_BK_0404T_SE ";
import { HeaterRegulationMode } from "./lib/machines/ElectricHeater";
import CWT_BK_0808R_S from "./lib/extensionModules/CWT_BK_0808R_S";
import FDH2_D_fire_purge_machine from "./lib/systems/FDH2_D_fire_purge_machine";

const A2 = new CWT_TM_2_PT1000(2);
const A3 = new CWT_BK_0404T_SE(3);
const A4 = new CWT_BK_0808R_S(4);

// Определям серверы Modbus
const modbusServer = new ModbusServer("/dev/ttyUSB0", 19200);

A2.setParent(modbusServer);
A3.setParent(modbusServer);
A4.setParent(modbusServer);

// Определяем MQTT сервер
const client = mqtt.connect("mqtt://localhost:1883");

// Определяем шину событий
const bus = new EventBus();

// Определяем алгоритмы
const heaters1: Array<HeaterRegulationMode> = [
  HeaterRegulationMode.CONTACTOR,
  HeaterRegulationMode.SOLID_RELAY,
  HeaterRegulationMode.CONTACTOR,
];
const heaters2: Array<HeaterRegulationMode> = [HeaterRegulationMode.CONTACTOR, HeaterRegulationMode.CONTACTOR];

const alg = new FDH2_D_fire_purge_machine(
  "П11П11Р",
  "П11",
  "/vent1",
  "/damper1",
  "/heater1",
  "П11Р",
  "/vent2",
  "/damper2",
  "/heater2",
  bus,
  heaters1,
  heaters2
);

alg.inletTemperature.connectPort(A2.RTD1);

alg.diff1.connectPort(A3.DI1);
alg.diff2.connectPort(A3.DI2);
alg.diffFilter.connectPort(A3.DI3);
alg.supplyDamper0.connectPort(A3.DI4);

alg.supplyDamper1.connectPort(A4.DI1);
alg.supplyDamper2.connectPort(A4.DI2);
alg.thermalContact1.connectPort(A4.DI3);
alg.thermalContact2.connectPort(A4.DI4);
alg.fire.connectPort(A4.DI5);

alg.heaterControllers1[1].connectPort(A3.DO1);
alg.damperActuatorInlet.connectPort(A3.DO2);
alg.damperActuator1.connectPort(A3.DO3);
alg.damperActuator2.connectPort(A3.DO4);

alg.runFan1.connectPort(A4.DO1);
alg.runFan2.connectPort(A4.DO2);
alg.heaterControllers1[0].connectPort(A4.DO3);
alg.heaterControllers1[2].connectPort(A4.DO4);

alg.heaterControllers2[0].connectPort(A4.DO5);
alg.heaterControllers2[1].connectPort(A4.DO6);

// Подписываемся на топики
client.subscribe(["/mode/set", "/getState", "/heater/mode/set"], (err) => {
  if (!err) console.log("SUBBED");
  else throw new Error("Ошибка подписки MQTT");
});

async function start() {
  await modbusServer.createConnection();
  await modbusServer.start();
}

start();

client.on("message", async (msgTopic: string, msg: Buffer) => {
  if (msgTopic === "/mode/set") {
    try {
      let msgStr = msg.toString();
      switch (msgStr) {
        case "START":
          await alg.start();
          break;
        case "STOP":
          await alg.stop();
          break;
        case "AUTO":
          alg.auto();
          break;

        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }
  if (msgTopic === "/heater/mode/set") {
    alg.setTempValue = Number(msg.toString());
  }
  if (msgTopic === "/getState") {
    alg.getState();
  }
});

bus.on("MQTTSend", (payload) => {
  client.publish(payload.topic, payload.value.toString());
});

alg.getState();
