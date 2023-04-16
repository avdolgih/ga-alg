import * as mqtt from "mqtt";
import Device from "./Modbus/Device";
import Register from "./Modbus/Register";
import Server, { Rate } from "./Modbus/Server";
import SWT_BK_0404R_S from "./devices/SWT_BK_0404R_S";
import Machine from "./classes/Machine";

const username = "";
const password = "";

const client = mqtt.connect("mqtt://test.mosquitto.org:1883", {
  username,
  password,
});

client.subscribe(["/M0/mode/set"], { qos: 2, nl: true }, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("SUBBED");
  }
});

let server = new Server([SWT_BK_0404R_S], "/dev/ttyUSB0", Rate.r9600);

let M1 = new Machine(
  [
    { state: "start", hmi: "Работает" },
    { state: "stop", hmi: "Ожидает" },
    { state: "auto", hmi: "Авто" },
    { state: "error", hmi: "Авария" },
  ],
  { state: "stop", hmi: "Ожидает" }
);

let M2 = new Machine(
  [
    { state: "start", hmi: "Работает" },
    { state: "stop", hmi: "Ожидает" },
    { state: "auto", hmi: "Авто" },
    { state: "error", hmi: "Авария" },
  ],
  { state: "stop", hmi: "Ожидает" }
);

client.on("message", (topic, message) => {
  message = message.toString();

  console.log(message.toString(), topic);

  if (topic === "/M0/mode/set") {
    try {
      let M1_res = M1.setState(message);
      let M2_res = M1.setState("stop");

      client.publish("/M1/mode/get", M1_res.state);
      client.publish("/M1/mode/get_hmi", M1_res.hmi);

      client.publish("/M2/mode/get", "stop");
      client.publish("/M2/mode/get_hmi", "Ожидает");

      client.publish("/M0/mode/get", message);
    } catch (error) {
      console.log(error);
    }
  }
});

// server.start();

// Описание логики
