import Damper_event from "../device_event/Damper";
import HeaterElectric_event from "../device_event/HeaterElectric";
import Vent_event from "../device_event/Vent";

export default class P10P10R_event {
  // Устройства
  private vent1: Vent_event = new Vent_event(5);
  private vent2: Vent_event = new Vent_event(5);
  private demp0: Damper_event = new Damper_event();
  private demp1: Damper_event = new Damper_event();
  private demp2: Damper_event = new Damper_event();
  private heater0: HeaterElectric_event = new HeaterElectric_event();
  private heater1: HeaterElectric_event = new HeaterElectric_event();
  private heater2: HeaterElectric_event = new HeaterElectric_event();

  // Локальные переменные

  // Шина событий
  private bus = new EventBus();

  constructor() {
    this.bus.on("startVent1", (payload) => {
      this.vent1.start(payload);
    });
    this.bus.on("startVent2", (payload) => {
      this.vent2.start(payload);
    });
    this.bus.on("diff1", (payload) => {
      this.vent1.diff(payload);
    });
    this.bus.on("diff2", (payload) => {
      this.vent2.diff(payload);
    });
    this.bus.on("diffFilter", (payload) => {});
    this.bus.on("supplyDamper0", (payload) => {});
    this.bus.on("supplyDamper1", (payload) => {});
    this.bus.on("supplyDamper2", (payload) => {});
    this.bus.on("thermalContact", (payload) => {});
    this.bus.on("fire", (payload) => {});
    this.bus.on("alarm", (payload) => {
      this.vent1.start(false);
      this.vent2.start(false);
    });
  }

  // Входные функции с возможностью преобразовать сигнал.
  public startHand(value: boolean) {}
  public startAuto(value: boolean) {}

  public inletTemperature(value: number) {
    this.bus.emit("inletTemperature", value);
  }

  public diff1(value: boolean) {
    this.bus.emit("diff1", value);
  }
  public diff2(value: boolean) {
    this.bus.emit("diff2", value);
  }
  public diffFilter(value: boolean) {
    this.bus.emit("diffFilter", value);
  }

  public supplyDamper0(value: boolean) {
    this.bus.emit("supplyDamper0", value);
  }
  public supplyDamper1(value: boolean) {
    this.bus.emit("supplyDamper1", value);
  }
  public supplyDamper2(value: boolean) {
    this.bus.emit("supplyDamper2", value);
  }

  public thermalContact(value: boolean) {
    this.bus.emit("thermalContact", value);
  }

  public fire(value: boolean) {
    this.bus.emit("fire", value);
  }

  // Внутренняя логика
  // Например установка и сброс ошибки или запуск вентилятора
  private Alarm() {}
}

type TLisetner = {
  topic: string;
  action: (payload: any) => void;
};

class EventBus {
  public listeners: TLisetner[] = [];

  public on(topic: TLisetner["topic"], action: TLisetner["action"]) {
    this.listeners.push({ topic, action });
  }
  public emit(topic: string, payload: any) {
    let acitveListeners = this.listeners.filter((listener) => listener.topic === topic);
    acitveListeners.forEach((listener) => {
      listener.action(payload);
    });
    console.log(acitveListeners);
  }
}
