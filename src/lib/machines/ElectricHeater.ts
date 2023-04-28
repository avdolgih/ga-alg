import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import Controller from "node-pid-controller";

export default class HeaterElectric {
  public readonly name: string;
  private bus: EventBus;
  private ctr: Controller;

  // Входные переменные
  private temperatureSignal: AlgAnalogInput; // Фактическая температура
  private termalContactSignal: AlgDiscreteInput; // Термоконтакт
  // Выходные переменные
  private controlSignal: AlgDiscreteOutput; // Выходной сигнал управления
  // Локальные переменные
  public mode: HeaterElectricMode = HeaterElectricMode.UNKNOWN;
  private settedTemperature?: number;
  private pidWindow: number;
  private PIDInterval?: NodeJS.Timer;
  private PWDLowTimer?: NodeJS.Timer;
  private termalContactTimer?: NodeJS.Timer;
  private termalContactTimeout: number = 1000;

  constructor(
    name: string,
    bus: EventBus,
    k_p: number,
    k_i: number,
    temperatureSignal: AlgAnalogInput,
    termalContactSignal: AlgDiscreteInput,
    controlSignal: AlgDiscreteOutput,
    pidWindow: number
  ) {
    this.name = name;
    this.bus = bus;
    this.ctr = new Controller(k_p, k_i);
    this.temperatureSignal = temperatureSignal;
    this.termalContactSignal = termalContactSignal;
    this.controlSignal = controlSignal;
    this.pidWindow = pidWindow;
    this.termalContactSignal.subscribe(this.termalContactWatch);
  }

  // Запуск нагревателя
  public async start(temperature: number): Promise<void> {
    if (this.mode === HeaterElectricMode.ERROR) return;
    this.mode = HeaterElectricMode.INPROGRESS;
    clearInterval(this.PIDInterval);
    clearTimeout(this.PWDLowTimer);
    this.ctr.setTarget(temperature);
    this.settedTemperature = temperature;
    this.pid_pwd();
  }

  // Остановка нагревателя
  public async stop(): Promise<void> {
    clearInterval(this.PIDInterval);
    clearTimeout(this.PWDLowTimer);
    if (this.mode === HeaterElectricMode.WAITING) return;
    if (this.mode === HeaterElectricMode.ERROR) return;
    this.controlSignal.value = false;
    this.mode = HeaterElectricMode.WAITING;
  }

  // Регулирование температуры
  private async pid_pwd() {
    this.PIDInterval = setInterval(() => {
      if (this.mode != (HeaterElectricMode.INPROGRESS || HeaterElectricMode.WORKING)) {
        clearInterval(this.PIDInterval);
        clearTimeout(this.PWDLowTimer);
        return;
      }
      // Обновляем значение
      let input = this.ctr.update(this.temperatureSignal.value);
      // "Нормируем" выход ПИД
      if (input < 0) input = 0;
      if (input > 100) input = 100;

      // High
      this.controlSignal.value = true;

      // Low
      this.PWDLowTimer = setTimeout(() => {
        this.controlSignal.value = false;
      }, this.pidWindow * (1 - input / 100));
    }, this.pidWindow);
  }

  private termalContactWatch = (value: boolean) => {
    if (value) {
      this.termalContactTimer = setTimeout(async () => {
        this.mode = HeaterElectricMode.ERROR;
        this.setErr();
        this.emitErr("termalContact error");
      }, this.termalContactTimeout);
    } else {
      clearTimeout(this.termalContactTimer);
    }
  };

  public resetErr() {
    if (this.mode === HeaterElectricMode.ERROR && this.termalContactSignal.value === false)
      this.mode = HeaterElectricMode.WAITING;
  }

  public setErr() {
    clearInterval(this.PIDInterval);
    clearTimeout(this.PWDLowTimer);
    this.controlSignal.value = false;
    this.mode = HeaterElectricMode.ERROR;
  }

  public emitErr(error: string) {
    this.bus.emit(`error`, { message: `${this.name}/${error}` });
  }
}

export enum HeaterElectricMode {
  WORKING = "WORKING",
  INPROGRESS = "INPROGRESS",
  WAITING = "WAITING",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
