// Система c двумя вентиляторами

// TODO: Доработать ручной и авто режимы
// TODO: доработать логику сброса при пожаре
import Fan from "../machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import cron from "node-cron";
import { getDay } from "../utils/utils";

export default class F1_diff_fire {
  public mode: SystemMode = SystemMode.WAITING;
  private bus: EventBus;
  private planner: cron.ScheduledTask;
  //   Подсистемы
  private fan1: Fan;
  private fan2: Fan;
  constructor(name: string, bus: EventBus) {
    this.fan1 = new Fan(name, bus, 10000, this.diff1, this.run1);
    this.fan2 = new Fan(name, bus, 10000, this.diff2, this.run2);
    this.bus = bus;
    this.fire.subscribe(this.fireLogic);

    // Каждый день в 12.05, если система работает в автоматическом режиме.
    this.planner = cron.schedule("* 5 12 * *", () => {
      if (this.mode === (SystemMode.AUTO && SystemMode.STARTING)) {
        this.start();
      }
    });
  }

  public fire = new AlgDiscreteInput();
  public diff1 = new AlgDiscreteInput();
  public diff2 = new AlgDiscreteInput();
  public run1 = new AlgDiscreteOutput();
  public run2 = new AlgDiscreteOutput();

  // Ручной старт системы
  public async start() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      let day = getDay();
      let isEven = day % 2 == 0;
      if (isEven) {
        await this.fan1.stop();
        await this.fan2.start();
      } else {
        await this.fan2.stop();
        await this.fan1.start();
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Старт системы авто
  public async auto() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      let day = getDay();
      let isEven = day % 2 == 0;
      this.planner.start();
      if (isEven) {
        await this.fan1.stop();
        await this.fan2.start();
      } else {
        await this.fan2.stop();
        await this.fan1.start();
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Остановка системы
  public async stop() {
    if (this.mode === (SystemMode.STOPING || SystemMode.WAITING || SystemMode.ERROR)) return;
    this.mode = SystemMode.STOPING;
    await Promise.all([this.fan1.stop(), this.fan2.stop()]);
    this.mode = SystemMode.WAITING;
  }

  // Сброс ошибок
  public async resetError() {
    if (!this.fire.value) return;
    this.fan1.resetErr();
    this.fan2.resetErr();
    this.mode = SystemMode.WAITING;
  }

  // Логика работы с сигналом пожара
  private async fireLogic(value: boolean) {
    if (!value) {
      this.mode = SystemMode.ERROR;
      await Promise.all([this.fan1.stop(), this.fan2.stop()]);
    }
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
