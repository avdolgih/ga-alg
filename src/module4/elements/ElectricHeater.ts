import EventBus from "../EventBus";

export default class HeaterElectric {
  // TODO: Ошибка термоконтакта
  // TODO: PID термонагревателя
  // TODO: Внедрить переменные для обновления
  public readonly name: string;
  private bus: EventBus;

  // Локальные переменные
  public mode: HeaterElectricMode = HeaterElectricMode.UNKNOWN;
  constructor(name: string, bus: EventBus) {
    this.name = name;
    this.bus = bus;
  }
  public async start(): Promise<boolean> {
    if (this.mode === HeaterElectricMode.WORKING) return true;
    if (this.mode === HeaterElectricMode.ERROR) return false;
    this.mode = HeaterElectricMode.WORKING;
    return true;
  }
  public stop() {
    if (this.mode === HeaterElectricMode.WAITNG) return true;
    if (this.mode === HeaterElectricMode.ERROR) return false;
    this.mode = HeaterElectricMode.WAITNG;
    return true;
  }

  public pid() {}

  public resetErr(value: boolean) {
    if (value === true && this.mode === HeaterElectricMode.ERROR) this.mode = HeaterElectricMode.UNKNOWN;
  }

  public setErr() {
    this.mode = HeaterElectricMode.ERROR;
  }

  public emitErr(error: string) {
    this.bus.emit(`${this.name}/${error}`, {});
  }
}

enum HeaterElectricMode {
  WORKING = "WORKING",
  WAITNG = "WAITING",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
