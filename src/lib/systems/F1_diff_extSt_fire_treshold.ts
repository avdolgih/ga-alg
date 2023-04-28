// Система с одним вентилятором, управление по перепаду и порогу с ошибкой по пожару
// TODO: посмотреть утром что тут написал
// TODO: Доработать ручной и авто режимы
// TODO: доработать логику сброса при пожаре

import Fan from "../machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";

export default class F1_diff_extSt_fire_treshold {
  public mode: SystemMode = SystemMode.WAITING;
  private bus: EventBus;
  //   Подсистемы
  private fan: Fan;
  constructor(name: string, bus: EventBus) {
    this.fan = new Fan(name, bus, 10000, this.diff, this.run);
    this.bus = bus;
    this.bus.on("error", () => {});

    this.threshold.subscribe(this.thresholdStart);
    this.extStart.subscribe(this.externalStart);
  }

  public fire = new AlgDiscreteInput();
  public diff = new AlgDiscreteInput();
  public extStart = new AlgDiscreteInput();
  public threshold = new AlgDiscreteInput();

  public run = new AlgDiscreteOutput();

  public async start() {
    try {
      await this.resetError();
      if (this.mode === SystemMode.HANDMODE && SystemMode.STARTING && SystemMode.ERROR) return;
      this.mode = SystemMode.STARTING;
      await this.fan.start();
      this.mode = SystemMode.HANDMODE;
      this.bus.emit("/mode/get", { value: "START" });
      this.bus.emit(`${this.fan.name}`, { value: "true" });
    } catch (error) {
      console.log(error);
    }
  }

  private externalStart = async () => {
    if (this.mode === (SystemMode.HANDMODE && SystemMode.ERROR)) return;
    if (this.extStart.value) await this.start();
    else this.stop();
  };

  private thresholdStart = async () => {
    if (this.mode != SystemMode.AUTO) return;
    this.threshold ? this.fan.start() : this.fan.stop;
  };

  public async stop() {
    try {
      if (this.mode === SystemMode.WAITING && SystemMode.STOPING && SystemMode.ERROR) return;
      this.mode = SystemMode.STOPING;
      await this.fan.stop();
      this.mode = SystemMode.WAITING;
    } catch (error) {
      console.log(error);
    }
    this.bus.emit("/mode/get", { value: "STOP" });
    this.bus.emit(`${this.fan.name}`, { value: "false" });
  }

  public async auto() {
    if (this.mode === SystemMode.AUTO && SystemMode.STARTING && SystemMode.ERROR) return;
    this.bus.emit("/mode/get", { value: "AUTO" });
    this.bus.emit(`${this.fan.name}`, { value: "true" });
  }

  public async resetError() {
    if (this.mode != SystemMode.ERROR) return;
    this.fan.resetErr;
    this.mode = SystemMode.WAITING;
  }

  public async fireStop(value: boolean) {
    if (!value) {
      await this.fan.stop();
      this.mode = SystemMode.ERROR;
    } else this.resetError();
  }
}
enum SystemMode {
  AUTO = "AUTO",
  HANDMODE = "HANDMODE",
  STARTING = "STARTING",
  WAITING = "WAITING",
  STOPING = "STOPING",
  ERROR = "ERROR",
}
