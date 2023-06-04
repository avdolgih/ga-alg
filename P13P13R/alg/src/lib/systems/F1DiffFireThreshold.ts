// Система с одним вентилятором, управление по перепаду и порогу с ошибкой по пожару

import FanDiff, { FanMode } from "../machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import { SystemMode, SystemStage } from "../utils/SystemMode";

export default class F1DiffFireThreshold {
  public mode: SystemMode = SystemMode.HANDMODE;
  public stage: SystemStage = SystemStage.STOP;
  private bus: EventBus;
  private errorStack: string[] = [];
  //   Подсистемы
  public fan: FanDiff;
  public readonly systemName: string;
  constructor(systemName: string, name: string, bus: EventBus) {
    this.systemName = systemName;
    this.fan = new FanDiff(systemName, name, bus, 10000, this.diff, this.run);
    this.bus = bus;
    this.bus.on("machineError", (payload) => {
      const msg = `${payload.subsytemName}. ${payload.message}`;
      this.errorStack.push(msg);

      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: msg, topic: "ERROR" });
      this.setError();
    });

    this.threshold.subscribe(this.thresholdStart);
    this.fire.subscribe(this.fireStop);
  }

  public fire = new AlgDiscreteInput();
  public diff = new AlgDiscreteInput();
  public threshold = new AlgDiscreteInput();

  public run = new AlgDiscreteOutput();

  // Запуск по порогу
  private thresholdStart = async (value: boolean) => {
    if (this.mode != SystemMode.AUTO) return;
    if (value) {
      // Если по какой-либо причине система уже запущена, то пропускаем
      if (this.stage === SystemStage.WORKING || this.stage === SystemStage.STARTING) return;
      this.stage = SystemStage.STARTING;
      await this.fan.start();
      if (this.fan.mode === FanMode.WORKING) {
        this.bus.emit(`${this.fan.name}`, { value: "true" });
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.systemName}` });
      }
    } else {
      this.stage = SystemStage.STOPING;
      await this.fan.stop();
      if (this.fan.mode === FanMode.WAITING) {
        this.bus.emit(`${this.fan.name}`, { value: "false" });
        this.stage = SystemStage.STOP;
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.systemName}` });
      }
    }
  };

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
      this.bus.emit(`MQTTSend`, { value: "START", topic: "/mode/get" });
      await this.fan.start();
      if (this.fan.mode === FanMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.systemName}` });
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
      if (this.stage === SystemStage.STOP || this.stage === SystemStage.STOPING) return;

      this.stage = SystemStage.STOPING;
      this.bus.emit(`MQTTSend`, { value: "STOP", topic: "/mode/get" });

      await this.fan.stop();
      this.stage = SystemStage.STOP;

      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.systemName}` });
    } catch (error) {
      console.log(error);
    }
  }

  public async auto() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      if (this.mode === SystemMode.AUTO) return;
      this.mode = SystemMode.AUTO;
      this.bus.emit(`MQTTSend`, { value: "AUTO", topic: "/mode/get" });
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
    this.stage = SystemStage.STOP;
  }

  // Ошибка по пожару
  public fireStop = (value: boolean) => {
    if (!value) {
      this.bus.emit(`MQTTSend`, { value: "Пожар", topic: "ERROR" });
      this.errorStack.push("Пожар");
      this.fan.stop();
      this.mode = SystemMode.ERROR;
      this.stage = SystemStage.STOP;
      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan.name}` });
    } else {
      if (this.fan.mode != FanMode.ERROR) this.resetError();
    }
  };

  public getState = () => {
    this.errorStack.forEach((error) => {
      this.bus.emit(`MQTTSend`, { value: error, topic: "ERROR" });
    });

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
