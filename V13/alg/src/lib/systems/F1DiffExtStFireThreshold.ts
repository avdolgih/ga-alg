// Система с одним вентилятором, управление по перепаду и порогу с ошибкой по пожару

import FanDiff, { FanMode } from "../machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";

import { SystemMode, SystemStage } from "../utils/SystemMode";

export default class F1DiffExtStFireThreshold {
  public mode: SystemMode = SystemMode.HANDMODE;
  public stage: SystemStage = SystemStage.STOP;
  private bus: EventBus;
  private errorStack: string[] = [];

  //   Подсистемы
  public fan: FanDiff;
  public readonly systemName: string;
  constructor(systemName: string, fanName: string, bus: EventBus) {
    this.systemName = systemName;
    this.fan = new FanDiff(systemName, fanName, bus, 10000, this.diff, this.run);
    this.bus = bus;

    this.bus.on("machineError", (payload) => {
      const msg = `${payload.message}`;
      this.errorStack.push(msg);

      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: msg, topic: "ERROR" });
      this.setError();
    });

    this.threshold.subscribe(this.thresholdStart);
    this.extStart.subscribe(this.externalStart);
    this.fire.subscribe(this.fireStop);
  }

  public fire = new AlgDiscreteInput();
  public diff = new AlgDiscreteInput();
  public extStart = new AlgDiscreteInput();
  public threshold = new AlgDiscreteInput();

  public run = new AlgDiscreteOutput();

  // Запуск по внешнему пускателю
  private externalStart = async (value: boolean) => {
    if (this.mode != SystemMode.AUTO) return;
    if (value) {
      // Если по какой-либо причине система уже запущена, то пропускаем
      if (this.stage === SystemStage.WORKING || this.stage === SystemStage.STARTING) return;
      this.stage = SystemStage.STARTING;
      await this.fan.start();
      if (this.fan.mode === FanMode.WORKING) {
        this.bus.emit("MQTTSend", { topic: `${this.systemName}`, value: "true" });
        this.stage = SystemStage.WORKING;
      }
    } else {
      // Если система сейчас должна работать по порогу, то пропускаем
      if (this.threshold.value) return;
      this.stage = SystemStage.STOPING;
      await this.fan.stop();
      if (this.fan.mode === FanMode.WAITING) {
        this.bus.emit("MQTTSend", { topic: `${this.systemName}`, value: "false" });
        this.stage = SystemStage.STOP;
      }
    }
  };

  // Запуск по порогу
  private thresholdStart = async (value: boolean) => {
    if (this.mode != SystemMode.AUTO) return;
    if (value) {
      // Если по какой-либо причине система уже запущена, то пропускаем
      if (this.stage === SystemStage.WORKING || this.stage === SystemStage.STARTING) return;
      this.stage = SystemStage.STARTING;
      await this.fan.start();
      console.log(this.fan.mode);

      if (this.fan.mode === FanMode.WORKING) {
        console.log(this.fan.mode, this.systemName);
        this.bus.emit("MQTTSend", { topic: `${this.systemName}`, value: "true" });
        this.stage = SystemStage.WORKING;
      }
    } else {
      // Если система запущена с внешнего пускателя, то пропускаем
      if (this.extStart.value) return;
      this.stage = SystemStage.STOPING;
      await this.fan.stop();
      if (this.fan.mode === FanMode.WAITING) {
        this.bus.emit("MQTTSend", { topic: `${this.systemName}`, value: "false" });
        this.stage = SystemStage.STOP;
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
      this.bus.emit("MQTTSend", { value: "START", topic: "/mode/get" });

      await this.fan.start();
      console.log(this.fan.mode, this.systemName);

      if (this.fan.mode === FanMode.WORKING) {
        console.log(this.fan.mode, this.systemName);
        this.stage = SystemStage.WORKING;
        this.bus.emit("MQTTSend", { topic: `${this.systemName}`, value: "true" });
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
      this.bus.emit("MQTTSend", { topic: `${this.systemName}`, value: "false" });
    } catch (error) {
      console.log(error);
    }
  }
  // TODO: Следует ли включать вентилятор в авто режиме при возможности управления по порогу
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
  private async resetError() {
    try {
      if (this.mode != SystemMode.ERROR) {
        this.bus.emit(`MQTTSend`, { value: "clear", topic: "ERROR" });
        return;
      }
      if (this.fire.value === false) return;
      console.log({ msg: "ERROR RESET" });

      this.fan.resetErr();
      this.mode = SystemMode.HANDMODE;
      this.stage = SystemStage.STOP;
      this.bus.emit(`MQTTSend`, { value: "clear", topic: "ERROR" });
      this.errorStack = [];
    } catch (error) {
      console.log(error);
    }
  }

  // Установка ошибки
  public async setError() {
    this.mode = SystemMode.ERROR;
    this.stage = SystemStage.STOPING;
    this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
    await this.fan.stop();
    this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.systemName}` });
    this.stage = SystemStage.STOP;
  }

  // Ошибка по пожару
  public fireStop = async (value: boolean) => {
    if (!value) {
      this.bus.emit(`MQTTSend`, { value: "Пожар", topic: "ERROR" });
      this.errorStack.push("Пожар");
      this.fan.stop();
      this.mode = SystemMode.ERROR;
      this.stage = SystemStage.STOP;
      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.systemName}` });
    } else {
      if (this.fan.mode != FanMode.ERROR) this.resetError();
    }
  };

  public getState = () => {
    if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STARTING || this.stage === SystemStage.WORKING))
      this.bus.emit(`MQTTSend`, { value: "START", topic: "/mode/get" });
    if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STOPING || this.stage === SystemStage.STOP))
      this.bus.emit(`MQTTSend`, { value: "STOP", topic: "/mode/get" });
    if (this.mode === SystemMode.AUTO) this.bus.emit(`MQTTSend`, { value: "AUTO", topic: "/mode/get" });
    if (this.mode === SystemMode.ERROR) this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });

    if (this.fan.mode === FanMode.WORKING || this.fan.mode === FanMode.STARTING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.systemName}` });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.systemName}` });
    }
  };
}
