import { AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import PWD from "../utils/PWD";

export default class HeaterElectric_v2 {
  public readonly name: string;
  private bus: EventBus;
  private heaterPWD: PWD;
  // Выходные переменные
  private controlSignal: AlgDiscreteOutput; // Выходной сигнал управления

  // Локальные переменные
  public mode: HeaterElectricMode = HeaterElectricMode.UNKNOWN;
  public regulationMode: HeaterRegulationMode;

  constructor(name: string, bus: EventBus, controlSignal: AlgDiscreteOutput, regulationMode: HeaterRegulationMode) {
    this.name = name;
    this.bus = bus;
    this.controlSignal = controlSignal;
    this.regulationMode = regulationMode;
    this.heaterPWD = new PWD(10000, this.controlSignal);
  }

  // Запуск нагревателя
  public async start(power: number): Promise<void> {
    if (this.mode === HeaterElectricMode.ERROR) return;
    this.mode = HeaterElectricMode.WORKING;
    if (this.regulationMode === HeaterRegulationMode.CONTACTOR) this.constantRun();
    if (this.regulationMode === HeaterRegulationMode.SOLID_RELAY) this.PWDRun(power);
  }

  // Остановка нагревателя
  public async stop(): Promise<void> {
    this.mode = HeaterElectricMode.WAITING;
    this.heaterPWD.stop();
    this.controlSignal.value = false;
  }

  // Работа в режиме ШИМ
  private async PWDRun(power: number) {
    this.heaterPWD.start(power);
  }

  // Работа в постоянном режиме
  private constantRun() {
    if (this.controlSignal.value === true) return;
    this.controlSignal.value = true;
  }

  public resetErr() {
    this.mode = HeaterElectricMode.WAITING;
  }

  public setErr() {
    this.controlSignal.value = false;
    this.heaterPWD.stop();
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

export enum HeaterRegulationMode {
  CONTACTOR = "CONTACTOR",
  SOLID_RELAY = "SOLID_RELAY",
}
