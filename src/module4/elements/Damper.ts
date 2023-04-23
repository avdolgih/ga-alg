import EventBus from "../EventBus";
import Port, { DiscreteInput, DiscreteOutput } from "../Port";

// TODO: Внедрить переменные для обновления

export default class Damper {
  public readonly name: string;
  private bus: EventBus;

  // Входные переменные
  public isOpened: boolean = false;
  // Выходные переменные
  private open: boolean = false;
  // Локальные переменные
  public mode: DamperMode = DamperMode.UNKNOWN;

  private timer?: NodeJS.Timeout;
  private timeout: number;

  constructor(name: string, bus: EventBus, timeout: number) {
    this.name = name;
    this.timeout = timeout;
    this.bus = bus;
  }
  public async openDamper(): Promise<boolean> {
    let result: boolean;
    if (this.mode === DamperMode.OPEN) return true;
    if (this.mode === DamperMode.ERROR) return false;
    this.timer ?? clearInterval(this.timer);
    result = await new Promise((resolve, regect) => {
      this.timer = setTimeout(() => {
        if (this.isOpened) {
          this.mode = DamperMode.OPEN;
          resolve(true);
        } else {
          resolve(false);
          this.setErr();
          this.emitErr("jammed");
        }
      }, this.timeout);
    });

    return result;
  }
  public async closeDamper(): Promise<boolean> {
    let result: boolean;
    if (this.mode === DamperMode.CLOSE) return true;
    if (this.mode === DamperMode.ERROR) return false;
    this.timer ?? clearInterval(this.timer);
    result = await new Promise((resolve, regect) => {
      this.timer = setTimeout(() => {
        if (!this.isOpened) {
          this.mode = DamperMode.CLOSE;
          resolve(true);
        } else {
          resolve(false);
          this.setErr();
          this.emitErr("jammed");
        }
      }, this.timeout);
    });

    return result;
  }
  public resetErr(value: boolean) {
    if (value === true && this.mode === DamperMode.ERROR) this.mode = DamperMode.UNKNOWN;
  }

  public setErr() {
    this.mode = DamperMode.ERROR;
  }

  public emitErr(error: string) {
    this.bus.emit(`${this.name}/${error}`, {});
  }
}

enum DamperMode {
  CLOSE = "CLOSE",
  INPROGRESS = "INPROGRESS",
  OPEN = "OPEN",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
