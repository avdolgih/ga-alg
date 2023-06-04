import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
const ac = new AbortController();
export default class FanDiff {
  public readonly name: string;
  private bus: EventBus;
  public mode: FanMode = FanMode.UNKNOWN;

  // Входные переменные
  public diffSignal: AlgDiscreteInput;

  // Выходные переменные
  public startSignal: AlgDiscreteOutput;

  // Локальные переменные
  private timeoutTimer?: NodeJS.Timeout;
  private timeout: number;

  private diffWatcherTimer?: NodeJS.Timeout;
  private diffWatcherTimeout = 1000;
  public readonly subsystemName: string;
  private resolver?: (value: unknown) => void;

  constructor(
    subsystemName: string,
    name: string,
    bus: EventBus,
    timeout: number,
    diff: AlgDiscreteInput,
    start: AlgDiscreteOutput
  ) {
    this.subsystemName = subsystemName;
    this.name = name;
    this.bus = bus;
    this.timeout = timeout;
    this.diffSignal = diff;
    this.startSignal = start;

    this.diffSignal.subscribe(this.diffWatcher);
    this.diffSignal.subscribe(this.isDiffWatcher);

    setTimeout(() => {
      if (this.startSignal.value) {
        this.mode = FanMode.WORKING;
      } else {
        this.mode = FanMode.WAITING;
      }
    }, 2000);
  }

  public async start(): Promise<void> {
    if (this.mode === FanMode.WORKING || this.mode === FanMode.STARTING) return;
    if (this.mode === FanMode.ERROR) throw new Error(`Ошибка вентилятора ${this.name}`);
    this.timeoutTimer ?? clearTimeout(this.timeoutTimer);
    this.startSignal.value = true;
    this.mode = FanMode.STARTING;

    await new Promise((resolve) => {
      this.timeoutTimer = setTimeout(() => {
        if (this.diffSignal.value) {
          this.mode = FanMode.WORKING;
          resolve(null);
        } else {
          console.log("ОШИБКА ВЕНТИЛЯТОРА ПРИ ЗАПУСКЕ");
          this.setErr();
          this.emitErr("Вентилятор");
          resolve(null);
        }
      }, this.timeout);
      this.resolver = function () {
        resolve(null);
        clearTimeout(this.timeoutTimer);
      };
    });
  }

  // Функция следит за перепадом при включении вентилятора
  private isDiffWatcher = async (value: boolean) => {
    if (this.mode === FanMode.STARTING) {
      if (value === true) {
        this.resolver && this.resolver(null);
        this.timeout ?? clearTimeout(this.timeout);
        this.mode = FanMode.WORKING;
      }
    }
  };
  // Функция следит за перепадом при включенном вентиляторе
  private diffWatcher = async (value: boolean) => {
    if (this.mode != FanMode.WORKING) return;
    if (!value) {
      console.log("ОШИБКА ВЕНТИЛЯТОРА В РАБОТЕ");
      this.diffWatcherTimer = setTimeout(async () => {
        this.mode = FanMode.ERROR;
        this.setErr();
        this.emitErr("Вентилятор");
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
    this.mode = FanMode.WAITING;
    this.timeoutTimer && clearTimeout(this.timeoutTimer);
  }

  public async purge(timeout: number): Promise<void> {
    if (this.mode === FanMode.ERROR) return;
    if (!this.startSignal.value) this.startSignal.value = true;
    this.mode = FanMode.PURGING;
    this.timeoutTimer ?? clearTimeout(this.timeoutTimer);

    await new Promise((resolve) => {
      this.timeoutTimer = setTimeout(() => {
        this.startSignal.value = false;
        this.mode = FanMode.WAITING;
        resolve(null);
      }, timeout);
    });
  }

  public resetErr() {
    if (this.mode === FanMode.ERROR) this.mode = FanMode.WAITING;
  }

  private setErr() {
    this.startSignal.value = false;
    clearTimeout(this.timeoutTimer);
    this.mode = FanMode.ERROR;
  }

  public emitErr(error: string) {
    this.bus.emit(`machineError`, { message: `${this.name}/${error}`, machine: "fan", subsitemName: this.subsystemName });
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
