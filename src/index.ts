// Цепочка
// interface Handler {
//   setNext(handler: Handler): Handler;
//   handle(request: string): string;
// }

// abstract class AbstractHandler implements Handler {
//   private nextHandler!: Handler;

//   public setNext(handler: Handler): Handler {
//     this.nextHandler = handler;
//     return handler;
//   }

//   public handle(request: string): string {
//     if (this.nextHandler) {
//       return this.nextHandler.handle(request);
//     }
//     return "null";
//   }
// }

// class DeviceLayer extends AbstractHandler {
//   public handle(request: string): string {
//     if (request === "DI") {
//       console.log("Я получил DI, запишу его в память и отправлю данные симулируемой машине.");
//       return super.handle(request);
//     }
//     return super.handle(request);
//   }
// }

// class MachineLayer extends AbstractHandler {
//   public handle(request: string): string {
//     if (request === "DI") {
//       console.log("Я получил DI, я обновлю свое состояние и отправлю топик с данными в mqtt.");
//       return super.handle("/topic");
//     }
//     return super.handle(request);
//   }
// }

// class MQTTLayer extends AbstractHandler {
//   public handle(request: string): string {
//     if (request === "/topic") {
//       console.log("Я получил топик и данные, время отправлять сообщение клиенту");
//       return "Готово";
//     }
//     return super.handle(request);
//   }
// }

// // modbus запускает процесс
// function clientCode(handler: Handler) {
//   const topic = "DI";
//   const result = handler.handle(topic);
//   console.log(result);
// }

// const Device = new DeviceLayer();
// const Machine = new MachineLayer();
// const MQTT = new MQTTLayer();

// Device.setNext(Machine).setNext(MQTT);

// clientCode(Device);

//  ----------------------------------------------------------------------------

// Посредник
// IDEA: Требуется один раз прописать логику для Modbus, mqtt, device а дальше
// для каждого шкафа можно написать логику оборудования
interface Mediator {
  notifyMQTT(payload: TNotifyMQTT, event: string): void;
  notifyModbus(payload: TNotifyModbus, event: string): void;
  notifyDevice(payload: TNotifyDevice, event: string): void;
  notifyMachine(payload: TNotifyMachine, event: string): void;
}

type TNotifyMQTT = { topic: string; message: string };
type TNotifyModbus = { slaveID: number; addr: number; value: number };
type TNotifyDevice = { slaveID: number; addr: number; value: number };
type TNotifyMachine = { topic: string; message: string };

class ConcreteMediator implements Mediator {
  private MQTT: MQTT;
  private Modbus: Modbus;
  private devices: Device[];
  private machines: Machine[];
  constructor(MQTT: MQTT, Modbus: Modbus, devices: Device[], machines: Machine[]) {
    this.MQTT = MQTT;
    this.Modbus = Modbus;
    this.devices = devices;
    this.machines = machines;

    this.MQTT.setMediator(this);
    this.Modbus.setMediator(this);
    this.devices.forEach((device) => {
      device.setMediator(this);
    });
    this.machines.forEach((machine) => {
      machine.setMediator(this);
    });
  }
  public notifyModbus(payload: TNotifyModbus, event: string): void {
    if (event === "readModbusValue") {
      let device = this.devices.find((device) => {
        return device.slaveID === payload.slaveID;
      });
      device?.updateReg(payload.addr, payload.value);
    }

    if (event === "setModbusValue") {
      console.log("MODBUS");

      let device = this.devices.find((device) => {
        return device.slaveID === payload.slaveID;
      });
      device?.updateReg(payload.addr, payload.value);
    }
  }

  public notifyDevice(payload: TNotifyDevice, event: string): void {
    if (event === "updateMachine") {
      let machine = this.machines.find((machine) => {
        return machine.slaveID === payload.slaveID;
      });
      machine?.internalSetState(payload.addr, payload.value);
    }
  }

  public notifyMachine(payload: TNotifyMachine, event: string): void {}

  public notifyMQTT(payload: TNotifyMQTT, event: string): void {
    if (event === "newMQTTMessage") {
      let machine = this.machines.find((machine) => {
        return machine.setTopics === payload.topic;
      });

      machine?.externalSetState(payload.topic, payload.message);
    }

    if (event === "sendMQTTMessage") {
      this.MQTT.sendMessage(payload.topic, payload.message);
    }
  }
}

class BaseComponent {
  protected mediator: Mediator;

  constructor(mediator?: Mediator) {
    this.mediator = mediator!;
  }

  public setMediator(mediator: Mediator): void {
    this.mediator = mediator;
  }
}

class Modbus extends BaseComponent {
  public readReg(slaveID: number, addr: number): void {
    console.log("MODBUS");
    console.log("Я прочитал значение регистра и отправил его в device");
    console.log("__________________________");
    let value = 0;
    this.mediator.notifyModbus({ slaveID, addr, value }, "readModbusValue");
  }
  public writeReg(slaveID: number, addr: number, value: number): void {
    console.log("Я записал значение регистра и при успехе отправлю его в значение device");
    console.log("__________________________");
    this.mediator.notifyModbus({ slaveID, addr: addr, value }, "setModbusValue");
  }
}

class Device extends BaseComponent {
  public readonly slaveID: number;
  constructor(slaveID: number) {
    super();
    this.slaveID = slaveID;
  }

  public updateReg(addr: number, value: number): void {
    console.log("DEVICE");
    console.log("Я получил новое значение, обновил его и отправил подключенному устройству");
    console.log("__________________________");
    this.mediator.notifyDevice({ slaveID: this.slaveID, addr, value }, "updateMachine");
  }
}

class Machine extends BaseComponent {
  public readonly slaveID: number;
  public readonly getTopic: string;
  public readonly setTopics: string;
  constructor(slaveID: number, getTopics: string, setTopics: string) {
    super();
    this.slaveID = slaveID;
    this.getTopic = getTopics;
    this.setTopics = setTopics;
  }

  // Логика обновления машины
  public internalSetState(addr: number, value: number): void {
    console.log("MACHINE");
    console.log("Я получил значение регистра, обновил состояние и сделал запрос на отправку MQTT сообщения");
    console.log("__________________________");
    this.mediator.notifyMQTT({ topic: this.getTopic, message: "START" }, "sendMQTTMessage");
  }

  // Логика для обновления машины извне
  public externalSetState(topic: string, message: string): void {
    console.log("MACHINE");
    console.log("Я получил новое сообщение set, проверил можно ли его обработать,и отправил запрос на обновление в модбас");
    console.log("__________________________");
    this.mediator.notifyModbus({ slaveID: this.slaveID, addr: 1, value: 5 }, "setModbusValue");
  }
}

class MQTT extends BaseComponent {
  public getMessage(): void {
    console.log("MQTT");
    console.log("Я получил сообщение и отправил данные дальше");
    console.log("__________________________");
    this.mediator.notifyMQTT({ topic: "/M1/mode/set", message: "Message" }, "newMQTTMessage");
  }
  public sendMessage(topic: string, message: string): void {
    console.log("MQTT");
    console.log("Я отправил сообщение и на этом все");
    console.log("__________________________");
  }
}

const MQTTClient = new MQTT();
const ModbusClient = new Modbus();

const device1 = new Device(1);
const device2 = new Device(2);

const vent1 = new Machine(device1.slaveID, "/M1/mode/get", "/M1/mode/set");
const vent2 = new Machine(device2.slaveID, "/M2/mode/get", "/M2/mode/set");

const mediator = new ConcreteMediator(MQTTClient, ModbusClient, [device1, device2], [vent1, vent2]);

console.log("Инициатор MQTT сообщение");
MQTTClient.getMessage();
console.log("________________________");
ModbusClient.readReg(1, 1);
