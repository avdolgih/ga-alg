// Система с одним вентилятором
// TODO: Доработать ручной и авто режимы
// TODO: доработать логику сброса при пожаре
import Damper from "../machines/Damper";
import Fan from "../machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";

export default class F1_diff_fire {
  public mode: SystemMode = SystemMode.WAITING;
  private bus: EventBus;
  //   Подсистемы
  private fan: Fan;
  private damper: Damper;
  constructor(name: string, bus: EventBus) {
    this.fan = new Fan(name, bus, 10000, this.diff, this.run);
    this.damper = new Damper(name, bus, 30000, this.isOpen, this.openSignal);
    this.bus = bus;
  }

  public fire = new AlgDiscreteInput();
  public diff = new AlgDiscreteInput();
  public run = new AlgDiscreteOutput();
  public isOpen = new AlgDiscreteInput();
  public openSignal = new AlgDiscreteOutput();

  public async start() {
    try {
      await this.resetError();
      if (this.mode === SystemMode.HANDMODE && SystemMode.STARTING && SystemMode.ERROR) return;
      this.mode = SystemMode.STARTING;
      await this.damper.open();
      await this.fan.start();
      this.mode = SystemMode.HANDMODE;
      this.bus.emit("/mode/get", { value: "START" });
      this.bus.emit(`${this.fan.name}`, { value: "true" });
    } catch (error) {
      console.log(error);
    }
  }

  public async stop() {
    try {
      if (this.mode === SystemMode.WAITING && SystemMode.STOPING && SystemMode.ERROR) return;
      this.mode = SystemMode.STOPING;
      await this.damper.close();
      await this.fan.stop();
      this.mode = SystemMode.WAITING;
    } catch (error) {
      console.log(error);
    }
    this.bus.emit("/mode/get", { value: "STOP" });
    this.bus.emit(`${this.fan.name}`, { value: "false" });
  }

  public async auto() {
    if (this.mode === SystemMode.HANDMODE && SystemMode.STARTING && SystemMode.ERROR) return;
    this.mode = SystemMode.STARTING;
    await this.damper.open();
    await this.fan.start();
    this.mode = SystemMode.AUTO;
    this.bus.emit("/mode/get", { value: "AUTO" });
    this.bus.emit(`${this.fan.name}`, { value: "true" });
  }

  public async resetError() {
    if (this.mode != SystemMode.ERROR) return;
    this.fan.resetErr;
    this.mode = SystemMode.WAITING;
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
