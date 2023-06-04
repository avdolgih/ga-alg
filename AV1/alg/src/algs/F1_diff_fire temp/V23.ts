import CWT_BK_0404R_S from "../../lib/extensionModules/CWT_BK_0404R_S";
import ModbusServer from "../../lib/modbus/ModbusServer";
import F1DiffFire from "../../lib/systems/F1DiffFire";
import * as mqtt from "mqtt";
import EventBus from "../../lib/utils/EventBus";
import CWT_TM_2_PT1000 from "../../lib/extensionModules/CWT_TM_2PT1000";
import F1DuffFireTemp from "../../lib/systems/F1DuffFireTemp";

// Определяем модули
const A2 = new CWT_TM_2_PT1000(1);
const A3 = new CWT_BK_0404R_S(2);

// Определям серверы Modbus
const modbusServer = new ModbusServer("/dev/ttyUSB0", 115200);

// Определяем MQTT сервер
const client = mqtt.connect("mqtt://localhost:1883");

// Определяем шину событий
const bus = new EventBus();

// Определяем алгоритмы
const alg = new F1DuffFireTemp("В23", "В23", bus);

A2.setParent(modbusServer);
A3.setParent(modbusServer);

alg.temperature.connectPort(A2.RTD1);
alg.diff.connectPort(A3.DI1);
alg.fire.connectPort(A3.DI2);

alg.run.connectPort(A3.DO1);

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
