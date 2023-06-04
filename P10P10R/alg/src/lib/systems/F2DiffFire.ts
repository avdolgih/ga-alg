// Система c двумя вентиляторами

import FanDiff, { FanMode } from "../machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import cron from "node-cron";
import { getDay } from "../utils/utils";
import { SystemMode, SystemStage } from "../utils/SystemMode";

export default class F2DiffFire {
  public mode: SystemMode = SystemMode.HANDMODE;
  public stage: SystemStage = SystemStage.STOP;
  private bus: EventBus;
  private errorStack: string[] = [];
  private planner: cron.ScheduledTask;
  //   Подсистемы
  public fan1: FanDiff;
  public fan2: FanDiff;
  constructor(systemName: string, fanName1: string, fanName2: string, bus: EventBus) {
    this.fan1 = new FanDiff(systemName, fanName1, bus, 10000, this.diff1, this.run1);
    this.fan2 = new FanDiff(systemName, fanName2, bus, 10000, this.diff2, this.run2);
    this.bus = bus;
    this.fire.subscribe(this.fireStop);

    // Каждый день в 12.05, если система работает в автоматическом режиме.
    this.planner = cron.schedule("* 5 12 * *", () => {
      if (this.mode === SystemMode.AUTO) {
        this.auto();
      }
    });

    this.bus.on("machineError", (payload) => {
      const msg = `${payload.subsytemName}. ${payload.message}`;
      this.errorStack.push(msg);

      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: msg, topic: "ERROR" });
      this.setError();
    });
  }

  public fire = new AlgDiscreteInput();
  public diff1 = new AlgDiscreteInput();
  public diff2 = new AlgDiscreteInput();
  public run1 = new AlgDiscreteOutput();
  public run2 = new AlgDiscreteOutput();

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
      let day = getDay();
      let isEven = day % 2 == 0;
      this.bus.emit(`MQTTSend`, { value: "START", topic: "/mode/get" });
      if (isEven) {
        await this.fan1.stop();
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan1.name}` });
        await this.fan2.start();
      } else {
        await this.fan2.stop();
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan2.name}` });
        await this.fan1.start();
      }
      if (this.fan1.mode === FanMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan1.name}` });
      }

      if (this.fan2.mode === FanMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan2.name}` });
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

      await this.fan1.stop();
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan1.name}` });

      await this.fan2.stop();
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan2.name}` });
    } catch (error) {
      console.log(error);
    }
  }

  // Пуск авто
  public async auto() {
    try {
      if (this.mode === SystemMode.ERROR) return;

      this.mode = SystemMode.AUTO;
      this.stage = SystemStage.STARTING;
      let day = getDay();
      let isEven = day % 2 == 0;
      this.bus.emit(`MQTTSend`, { value: "AUTO", topic: "/mode/get" });
      if (isEven) {
        await this.fan1.stop();
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan1.name}` });
        await this.fan2.start();
      } else {
        await this.fan2.stop();
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan2.name}` });
        await this.fan1.start();
      }
      if (this.fan1.mode === FanMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan1.name}` });
      }

      if (this.fan2.mode === FanMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan2.name}` });
      }
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
    this.fan1.resetErr();
    this.fan2.resetErr();
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

    Promise.all([this.fan1.stop(), this.fan2.stop()]);
    this.stage = SystemStage.STOP;
  }

  // Ошибка по пожару
  public fireStop = (value: boolean) => {
    if (!value) {
      this.bus.emit(`MQTTSend`, { value: "Пожар", topic: "ERROR" });
      this.errorStack.push("Пожар");
      Promise.all([this.fan1.stop(), this.fan2.stop()]);
      this.mode = SystemMode.ERROR;
      this.stage = SystemStage.STOP;
    } else {
      if (this.fan1.mode === FanMode.ERROR || this.fan2.mode === FanMode.ERROR) return;
      this.resetError();
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

    if (this.fan1.mode === FanMode.WORKING || this.fan1.mode === FanMode.STARTING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan1.name}` });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan1.name}` });
    }

    if (this.fan2.mode === FanMode.WORKING || this.fan2.mode === FanMode.STARTING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan2.name}` });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan2.name}` });
    }
  };
}
