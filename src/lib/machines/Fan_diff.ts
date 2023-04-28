import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";

export default class Fan {
  public readonly name: string;
  private bus: EventBus;
  public mode: FanMode = FanMode.UNKNOWN;

  // Входные переменные
  public diffSignal: AlgDiscreteInput;

  // Выходные переменные
  private startSignal: AlgDiscreteOutput;

  // Локальные переменные
  private timeoutTimer?: NodeJS.Timeout;
  private timeout: number;

  private diffWatcherTimer?: NodeJS.Timeout;
  private diffWatcherTimeout = 1000;

  constructor(name: string, bus: EventBus, timeout: number, diff: AlgDiscreteInput, start: AlgDiscreteOutput) {
    this.name = name;
    this.bus = bus;
    this.timeout = timeout;
    this.diffSignal = diff;
    this.startSignal = start;

    this.diffSignal.subscribe(this.diffWatcher);
  }

  public async start(): Promise<void> {
    if (this.mode === (FanMode.WORKING && FanMode.STARTING)) return;
    if (this.mode === FanMode.ERROR) throw new Error(`Ошибка вентилятора ${this.name}`);
    this.timeoutTimer ?? clearInterval(this.timeoutTimer);
    this.startSignal.value = true;
    this.mode = FanMode.STARTING;
    await new Promise((resolve, regect) => {
      this.timeoutTimer = setTimeout(() => {
        if (this.diffSignal.value) {
          this.mode = FanMode.WORKING;
          resolve(true);
        } else {
          this.setErr();
          this.emitErr("Fan jammed");
          throw new Error(`Ошибка вентилятора ${this.name}`);
        }
      }, this.timeout);
    });
  }

  // Функция следит за перепадом при включении вентилятора
  private diffWatcher = async (value: boolean) => {
    if (this.mode != FanMode.WORKING && FanMode.PURGING) return;
    if (!value) {
      this.diffWatcherTimer = setTimeout(async () => {
        this.mode = FanMode.ERROR;
        this.setErr();
        this.emitErr("diff error");
      }, this.diffWatcherTimeout);
    } else {
      clearTimeout(this.diffWatcherTimer);
    }
  };

  // // Функция останавливает вентилятор в обычном режиме с отслеживанием перепада
  // public async stop(): Promise<boolean> {
  //   let result: boolean;
  //   if (this.mode === FanMode.WAITING) return true;
  //   if (this.mode === FanMode.ERROR) return false;
  //   this.startSignal.value = false;
  //   this.timeoutTimer ?? clearInterval(this.timeoutTimer);
  //   result = await new Promise((resolve, reject) => {
  //     this.timeoutTimer = setTimeout(() => {
  //       if (!this.diffSignal) {
  //         this.mode = FanMode.WAITING;
  //         resolve(true);
  //       } else {
  //         this.setErr();
  //         this.emitErr("jammed");
  //         throw new Error(`Ошибка вентилятора ${this.name}`);
  //       }
  //     }, this.timeout);
  //   });

  //   return result;
  // }

  public async stop(): Promise<void> {
    if (this.mode === FanMode.WAITING) return;
    if (this.mode === FanMode.ERROR) return;
    this.startSignal.value = false;
    this.timeoutTimer ?? clearInterval(this.timeoutTimer);
  }

  public async purge(timeout: number): Promise<void> {
    if (this.mode === FanMode.ERROR) throw new Error(`Ошибка вентилятора ${this.name}`);
    if (!this.startSignal.value) this.startSignal.value = true;
    this.mode = FanMode.PURGING;
    this.timeoutTimer ?? clearInterval(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      this.startSignal.value = false;
      this.mode = FanMode.WAITING;
    }, timeout);
  }

  public resetErr() {
    if (this.mode === FanMode.ERROR) this.mode = FanMode.WAITING;
  }

  private setErr() {
    this.mode = FanMode.ERROR;
    this.startSignal.value = false;
    clearTimeout(this.timeoutTimer);
  }

  public emitErr(error: string) {
    this.bus.emit(`error`, { message: `${this.name}/${error}` });
  }
}

export enum FanMode {
  WORKING = "WORKING",
  STARTING = "STARTING",
  WAITING = "WAITING",
  STOPING = "STOPING",
  PURGING = "PURGING",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
