import EventBus from "../EventBus";
import Timer from "./Timer";

// TODO: Внедрить переменные для обновления

export default class Fan {
  public readonly name: string;
  private bus: EventBus;
  public mode: FunMode = FunMode.UNKNOWN;

  // Входные переменные
  public diff: boolean = false;

  // Выходные переменные

  // Локальные переменные
  private timer?: NodeJS.Timeout;
  private timeout: number;

  constructor(name: string, bus: EventBus, timeout: number) {
    this.name = name;
    this.bus = bus;
    this.timeout = timeout;
  }

  public async startFun(): Promise<boolean> {
    let result: boolean;
    if (this.mode === FunMode.WORKING) return true;
    if (this.mode === FunMode.ERROR) return false;
    this.timer ?? clearInterval(this.timer);
    result = await new Promise((resolve, regect) => {
      this.timer = setTimeout(() => {
        if (this.diff) {
          this.mode = FunMode.WORKING;
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

  public async stopFun(): Promise<boolean> {
    let result: boolean;
    if (this.mode === FunMode.WAITING) return true;
    if (this.mode === FunMode.ERROR) return false;
    this.timer ?? clearInterval(this.timer);
    result = await new Promise((resolve, regect) => {
      this.timer = setTimeout(() => {
        if (this.diff) {
          this.mode = FunMode.WAITING;
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

  public async purge(): Promise<boolean> {
    let result: boolean;
    if (this.mode === FunMode.WAITING) return true;
    if (this.mode === FunMode.ERROR) return false;
    this.timer ?? clearInterval(this.timer);
    result = await new Promise((resolve, regect) => {
      this.timer = setTimeout(() => {
        this.mode = FunMode.WAITING;
        resolve(true);
      }, 30000);
    });

    return result;
  }

  public resetErr(value: boolean) {
    if (value === true && this.mode === FunMode.ERROR) this.mode = FunMode.UNKNOWN;
  }

  public setErr() {
    this.mode = FunMode.ERROR;
  }

  public emitErr(error: string) {
    this.bus.emit(`${this.name}/${error}`, {});
  }
}

enum FunMode {
  WORKING = "WORKING",
  INPROGRESS = "INPROGRESS",
  WAITING = "WAITING",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
