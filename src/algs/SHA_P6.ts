import CWT_BK_0404R_S from "../lib/extensionModules/CWT_BK_0404R_S";
import ModbusServer from "../lib/modbus/ModbusServer";
import F1_diff_fire from "../lib/systems/F1_diff_fire";
import * as mqtt from "mqtt";
import EventBus from "../lib/utils/EventBus";

// Определяем модули
let A2 = new CWT_BK_0404R_S(1);

// Определям серверы Modbus
let modbusCLI = new ModbusServer("", 9600);

// Определяем MQTT сервер
let client = mqtt.connect("mqtt://localhost:1883");

// Определяем шину событий
let bus = new EventBus();

// Определяем алгоритмы
let alg = new F1_diff_fire("/vent1", bus);

// Соединяем модули с модбас сервером
A2.setParent(modbusCLI);

// Соединяем алгоритм с входами модулей
alg.diff.connectPort(A2.DI1);
alg.fire.connectPort(A2.DI2);
alg.run.connectPort(A2.DO1);

// Подписываемся на топики
client.subscribe(["/mode/set"], (err) => {
  if (!err) console.log("SUBBED");
  else throw new Error("Ошибка подписки MQTT");
});

// TODO: привести общение алгоритма с mqtt к единому знаменателю

bus.on("/mode/get", (payload) => {
  client.publish("/mode/get", payload.value);
});
bus.on("error", (payload) => {
  client.publish("/error", payload.message);
});
bus.on("/vent1", (payload) => {
  client.publish("/vent1", payload.value);
});

client.on("message", async (msgTopic: string, msg: Buffer) => {
  if ("/mode/set" === msgTopic) {
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
});
