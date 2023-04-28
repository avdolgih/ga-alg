import EventBus from "../utils/EventBus";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";

export default class Damper {
  public readonly name: string;
  private bus: EventBus;
  public mode: DamperMode = DamperMode.UNKNOWN;

  // Входные переменные
  public isOpenSignal: AlgDiscreteInput;
  // Выходные переменные
  private openSignal: AlgDiscreteOutput;

  // Локальные переменные

  private timer?: NodeJS.Timeout;
  private timeout: number;

  constructor(name: string, bus: EventBus, timeout: number, isOpenSignal: AlgDiscreteInput, openSignal: AlgDiscreteOutput) {
    this.name = name;
    this.timeout = timeout;
    this.bus = bus;
    this.isOpenSignal = isOpenSignal;
    this.openSignal = openSignal;
  }

  // Функция открытия заслонки с отслеживанием положения
  public async open(): Promise<void> {
    if (this.mode === (DamperMode.OPEN || DamperMode.OPENING)) return;
    if (this.mode === DamperMode.ERROR) throw new Error(`Ошибка заслонки ${this.name}`);
    this.timer ?? clearInterval(this.timer);
    this.mode = DamperMode.OPENING;
    this.openSignal.value = true;
    await new Promise((resolve, regect) => {
      this.timer = setTimeout(() => {
        if (this.isOpenSignal.value) {
          this.mode = DamperMode.OPEN;
          resolve(true);
        } else {
          this.setErr();
          this.emitErr("Damper_jammed");
          throw new Error(`Ошибка заслонки ${this.name}`);
        }
      }, this.timeout);
    });
  }

  // Функция закрытия заслонки с отслеживанием положения
  public async close(): Promise<void> {
    if (this.mode === (DamperMode.CLOSE && DamperMode.CLOSING)) return;
    if (this.mode === DamperMode.ERROR) throw new Error(`Ошибка заслонки ${this.name}`);
    this.timer ?? clearInterval(this.timer);
    this.mode = DamperMode.CLOSING;
    await new Promise((resolve, regect) => {
      this.timer = setTimeout(() => {
        if (!this.isOpenSignal.value) {
          this.mode = DamperMode.CLOSE;
          resolve(true);
        } else {
          this.setErr();
          this.emitErr("Damper_jammed");
          throw new Error(`Ошибка заслонки ${this.name}`);
        }
      }, this.timeout);
    });
  }

  public resetErr() {
    if (this.mode === DamperMode.ERROR) this.mode = DamperMode.UNKNOWN;
  }

  public setErr() {
    this.mode = DamperMode.ERROR;
  }

  public emitErr(error: string) {
    this.bus.emit(`error`, { message: `${this.name}/${error}` });
  }
}

export enum DamperMode {
  CLOSE = "CLOSE",
  CLOSING = "CLOSING",
  OPENING = "OPENING",
  OPEN = "OPEN",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
