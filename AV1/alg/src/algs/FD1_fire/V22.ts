import CWT_BK_0404R_S from "../../lib/extensionModules/CWT_BK_0404R_S";
import ModbusServer from "../../lib/modbus/ModbusServer";
import F1DiffFire from "../../lib/systems/F1DiffFire";
import * as mqtt from "mqtt";
import EventBus from "../../lib/utils/EventBus";
import FD1Fire from "../../lib/systems/FD1Fire";

// Определяем модули
const A2 = new CWT_BK_0404R_S(1);

// Определям серверы Modbus
const modbusServer = new ModbusServer("/dev/ttyUSB0", 115200);

// Определяем MQTT сервер
const client = mqtt.connect("mqtt://localhost:1883");

// Определяем шину событий
const bus = new EventBus();

// Определяем алгоритмы
const alg = new FD1Fire("В22", "/vent1", "/damper", bus);

A2.setParent(modbusServer);

alg.diff.connectPort(A2.DI1);
alg.isOpen.connectPort(A2.DI2);
alg.fire.connectPort(A2.DI3);

alg.run.connectPort(A2.DO1);
alg.openSignal.connectPort(A2.DO2);

// Подписываемся на топики
client.subscribe(["/mode/set", "/getState"], (err) => {
  if (!err) console.log("SUBBED");
  else throw new Error("Ошибка подписки MQTT");
});

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

  if (msgTopic === "/getState") {
    alg.getState();
  }
});

bus.on("MQTTSend", (payload) => {
  client.publish(payload.topic, payload.value.toString());
});
