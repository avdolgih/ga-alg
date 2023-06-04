import EventBus from "../utils/EventBus";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";

export default class Damper {
  public readonly name: string;
  public readonly subsystemName: string;
  private bus: EventBus;
  public mode: DamperMode = DamperMode.UNKNOWN;

  // Входные переменные
  public isOpenSignal: AlgDiscreteInput;
  // Выходные переменные
  private openSignal: AlgDiscreteOutput;

  // Локальные переменные

  private timer?: NodeJS.Timeout;
  private timeout: number;

  private resolver?: () => void;

  constructor(
    subsystemName: string,
    name: string,
    bus: EventBus,
    timeout: number,
    isOpenSignal: AlgDiscreteInput,
    openSignal: AlgDiscreteOutput
  ) {
    this.subsystemName = subsystemName;
    this.name = name;
    this.timeout = timeout;
    this.bus = bus;
    this.isOpenSignal = isOpenSignal;
    this.openSignal = openSignal;
    isOpenSignal.subscribe(this.isOpenWatcher);

    setTimeout(() => {
      if (this.openSignal.value) {
        this.mode = DamperMode.OPEN;
      } else {
        this.mode = DamperMode.CLOSE;
      }
    }, 2000);
  }

  // Функция открытия заслонки с отслеживанием положения
  public async open(): Promise<void> {
    if (this.mode === (DamperMode.OPEN || DamperMode.OPENING)) return;
    if (this.mode === DamperMode.ERROR) return;
    this.timer ?? clearTimeout(this.timer);
    this.mode = DamperMode.OPENING;
    this.openSignal.value = true;

    this.resolver && this.resolver();
    this.timer && clearTimeout(this.timer);

    await new Promise((resolve, reject) => {
      this.timer = setTimeout(() => {
        if (!this.isOpenSignal.value) {
          this.mode = DamperMode.OPEN;
          resolve(null);
        } else {
          this.setErr();
          this.emitErr("Заслонка. Открытие");
          resolve(null);
        }
      }, this.timeout);

      this.resolver = function () {
        resolve(null);
        clearTimeout(this.timer);
      };
    });
  }

  // Функция закрытия заслонки с отслеживанием положения
  public async close(): Promise<void> {
    if (this.mode === (DamperMode.CLOSE && DamperMode.CLOSING)) return;
    if (this.mode === DamperMode.ERROR) return;
    this.timer && clearTimeout(this.timer);
    this.mode = DamperMode.CLOSING;

    this.openSignal.value = false;

    this.resolver && this.resolver();
    this.timer && clearTimeout(this.timer);

    await new Promise((resolve, reject) => {
      this.timer = setTimeout(() => {
        if (this.isOpenSignal.value) {
          this.mode = DamperMode.CLOSE;
          resolve(null);
        } else {
          this.setErr();
          this.emitErr("Заслонка. Закрытие");
          resolve(null);
        }
      }, this.timeout);

      this.resolver = function () {
        resolve(null);
        clearTimeout(this.timer);
      };
    });
  }

  private isOpenWatcher = async (value: boolean) => {
    if (this.mode === DamperMode.CLOSING) {
      if (value === true) {
        this.resolver && this.resolver();
        this.timer ?? clearTimeout(this.timer);
        this.mode = DamperMode.CLOSE;
      }
    }
    if (this.mode === DamperMode.OPENING) {
      if (value === false) {
        this.resolver && this.resolver();
        this.timer ?? clearTimeout(this.timer);
        this.mode = DamperMode.OPEN;
      }
    }
  };

  public resetErr() {
    if (this.mode === DamperMode.ERROR) this.mode = DamperMode.UNKNOWN;
  }

  public setErr() {
    console.log("ОШИБКА ЗАСЛОНКИ");

    this.openSignal.value = !this.openSignal.value;
    this.mode = DamperMode.ERROR;
  }

  public emitErr(error: string) {
    console.log("EMIT ERROR");

    this.bus.emit(`machineError`, { message: error, machine: "damper", subsytemName: this.subsystemName });
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
