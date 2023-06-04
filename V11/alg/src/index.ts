import CWT_BK_0404R_S from "./lib/extensionModules/CWT_BK_0404R_S";
import ModbusServer from "./lib/modbus/ModbusServer";
import * as mqtt from "mqtt";
import EventBus from "./lib/utils/EventBus";
import F1DiffExtStFireThreshold from "./lib/systems/F1DiffExtStFireThreshold";

// Определяем модули
const A2 = new CWT_BK_0404R_S(2);

// Определям серверы Modbus
const modbusServer = new ModbusServer("/dev/ttyUSB0", 115200);

// Определяем MQTT сервер
const client = mqtt.connect("mqtt://localhost:1883");

// Определяем шину событий
const bus = new EventBus();

// Определяем алгоритмы
const alg = new F1DiffExtStFireThreshold("В11", "В11", bus);

A2.setParent(modbusServer);

alg.diff.connectPort(A2.DI1);
alg.extStart.connectPort(A2.DI2);
alg.threshold.connectPort(A2.DI3);
alg.fire.connectPort(A2.DI4);
alg.run.connectPort(A2.DO1);

// Подписываемся на топики
client.subscribe(["/mode/set", "/getState"], (err) => {
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

  if (msgTopic === "/getState") {
    alg.getState();
  }
});

bus.on("MQTTSend", (payload) => {
  client.publish(payload.topic, payload.value.toString());
});

alg.getState();
