// Система с одним вентилятором
// TODO: Доработать ручной и авто режимы
// TODO: доработать логику сброса при пожаре
import Fan from "../machines/Fan_diff";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";

export default class F1_diff_fire_temp {
  public mode: SystemMode = SystemMode.WAITING;
  private bus: EventBus;
  //   Подсистемы
  private fan: Fan;
  constructor(name: string, bus: EventBus) {
    this.fan = new Fan(name, bus, 10000, this.diff, this.run);
    this.bus = bus;
    this.temperature.subscribe(this.temperatureWatch);
  }

  public fire = new AlgDiscreteInput();
  public diff = new AlgDiscreteInput();
  public run = new AlgDiscreteOutput();
  public temperature = new AlgAnalogInput();

  // TODO: Разобраться что делать с температурой
  private temperatureWatch(temperature: number) {
    this.bus.emit("/temperature/get", { value: temperature });
    console.log(temperature);
  }

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
    if (this.mode === SystemMode.HANDMODE && SystemMode.STARTING && SystemMode.ERROR) return;
    this.mode = SystemMode.STARTING;
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
