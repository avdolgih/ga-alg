// Система с одним вентилятором и срабатывание по гистерезису

import FanDiff, { FanMode } from "../machines/Fan_diff";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import { SystemMode, SystemStage } from "../utils/SystemMode";

export default class F1DuffFireTemp {
  public mode: SystemMode = SystemMode.HANDMODE;
  public stage: SystemStage = SystemStage.STOP;
  private errorStack: string[] = [];
  private bus: EventBus;
  //   Подсистемы
  public fan: FanDiff;
  readonly systemName: string;
  constructor(systemName: string, fanName: string, bus: EventBus) {
    this.systemName = systemName;
    this.fan = new FanDiff(systemName, fanName, bus, 10000, this.diff, this.run);
    this.bus = bus;
    this.temperature.subscribe(this.temperatureWatch);
    this.fire.subscribe(this.fireStop);
    this.bus.on("machineError", (payload) => {
      const msg = `${payload.subsytemName}. ${payload.message}`;
      this.errorStack.push(msg);

      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: msg, topic: "ERROR" });
      this.setError();
    });
  }

  public fire = new AlgDiscreteInput();
  public diff = new AlgDiscreteInput();
  public run = new AlgDiscreteOutput();
  public temperature = new AlgAnalogInput();

  private _setTempValue: number = 20;

  private temperatureWatch = async (temperature: number) => {
    console.log("TEMP WATCHER");
    this.bus.emit(`MQTTSend`, { value: temperature, topic: "/temperature/get" });

    if (this.mode != SystemMode.AUTO) return;

    if (temperature >= this._setTempValue + 0.15) {
      this.stage = SystemStage.STARTING;
      await this.fan.start();
      if (this.fan.mode === FanMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan.name}` });
      }
    }

    if (temperature <= this._setTempValue - 0.15) {
      this.stage = SystemStage.STOPING;
      await this.fan.stop();
      if (this.fan.mode === FanMode.WAITING) {
        this.stage = SystemStage.STOP;
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan.name}` });
      }
    }
    this.bus.emit("MQTTSend", { value: temperature, topic: "/temperature/get" });
  };

  public set setTempValue(value: number) {
    if (value < 15 || value > 30) return;
    this._setTempValue = value;
    this.bus.emit("MQTTSend", { value, topic: "/temperature/set" });
  }

  public get setTempValue() {
    return this._setTempValue;
  }

  // ---------------------------------------------------------------------------------
  // Ручной пуск
  public async start() {
    try {
      await this.resetError();
      if (this.mode === SystemMode.ERROR) return;
      if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STARTING || this.stage === SystemStage.WORKING))
        return;
      this.mode = SystemMode.HANDMODE;
      this.stage = SystemStage.STARTING;
      this.bus.emit("MQTTSend", { value: "START", topic: "/mode/get" });

      await this.fan.start();
      if (this.fan.mode === FanMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan.name}` });
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Остановка с выводом в ручной режим
  public async stop() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      this.mode = SystemMode.HANDMODE;

      this.stage = SystemStage.STOPING;
      this.bus.emit("MQTTSend", { value: "STOP", topic: "/mode/get" });

      await this.fan.stop();
      this.stage = SystemStage.STOP;
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan.name}` });
    } catch (error) {
      console.log(error);
    }
  }

  // Пуск авто
  public async auto() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      if (this.mode === SystemMode.AUTO) return;
      this.mode = SystemMode.AUTO;
      this.bus.emit("MQTTSend", { value: "AUTO", topic: "/mode/get" });
    } catch (error) {
      console.log(error);
    }
  }
  // Сброс ошибки
  public async resetError() {
    if (this.mode != SystemMode.ERROR) {
      this.bus.emit(`MQTTSend`, { value: "clear", topic: "ERROR" });
      return;
    }
    if (this.mode != SystemMode.ERROR) return;
    if (this.fire.value === false) return;
    this.fan.resetErr();
    this.mode = SystemMode.HANDMODE;
    this.stage = SystemStage.STOP;
    this.bus.emit(`MQTTSend`, { value: "clear", topic: "ERROR" });
    this.errorStack = [];
  }

  // Установка ошибки
  public async setError() {
    this.mode = SystemMode.ERROR;
    this.stage = SystemStage.STOPING;
    this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });

    await this.fan.stop();
    this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan.name}` });
    this.stage = SystemStage.STOP;
  }

  // Ошибка по пожару
  public fireStop = (value: boolean) => {
    this.bus.emit(`MQTTSend`, { value: "Пожар", topic: "ERROR" });

    console.log("FIRE", { value });
    if (!value) {
      this.errorStack.push("Пожар");
      this.fan.stop();
      this.mode = SystemMode.ERROR;
      this.stage = SystemStage.STOP;
    } else {
      if (this.fan.mode != FanMode.ERROR) this.resetError();
    }
  };

  public getState = () => {
    console.log("ERROR STACK", this.errorStack);

    this.errorStack.forEach((error) => {
      this.bus.emit(`MQTTSend`, { value: error, topic: "ERROR" });
    });

    this.bus.emit(`MQTTSend`, { value: this.temperature.value, topic: "/temperature/get" });

    if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STARTING || this.stage === SystemStage.WORKING))
      this.bus.emit(`MQTTSend`, { value: "START", topic: "/mode/get" });
    if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STOPING || this.stage === SystemStage.STOP))
      this.bus.emit(`MQTTSend`, { value: "STOP", topic: "/mode/get" });
    if (this.mode === SystemMode.AUTO) this.bus.emit(`MQTTSend`, { value: "AUTO", topic: "/mode/get" });
    if (this.mode === SystemMode.ERROR) this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });

    if (this.fan.mode === FanMode.WORKING || this.fan.mode === FanMode.STARTING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan.name}` });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan.name}` });
    }
  };
}
