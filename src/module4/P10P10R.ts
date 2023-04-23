import EventBus from "./EventBus";
import Damper from "./elements/Damper";
import HeaterElectric from "./elements/ElectricHeater";
import Fan from "./elements/Fan";

export default class P10P10R_event {
  // Режим
  // Устройства
  private bus = new EventBus();

  private fan1: Fan = new Fan("P10", this.bus, 5000);
  private fan2: Fan = new Fan("P10R", this.bus, 5000);
  private demp0: Damper = new Damper("damperInlet", this.bus, 30000);
  private demp1: Damper = new Damper("damperInlet", this.bus, 30000);
  private demp2: Damper = new Damper("damperInlet", this.bus, 30000);
  private heater1: HeaterElectric = new HeaterElectric("heater1", this.bus);
  private heater2: HeaterElectric = new HeaterElectric("heater2", this.bus);

  // Локальные переменные

  // Шина событий

  constructor() {
    this.bus.on("startFan1", () => {});
    this.bus.on("startFan2", () => {});
    this.bus.on("stopFan1", () => {});
    this.bus.on("stopFan2", () => {});
    this.bus.on("error", () => {});
    this.bus.on("warning", () => {});
  }

  // Входные функции
  // Температура притока
  public inletTemperature(value: number | boolean | undefined) {
    this.bus.emit("inletTemperature", value);
  }

  // Перепад вентилятор 1
  public diff1(value: boolean) {
    this.bus.emit("diff1", value);
  }

  // Перепад вентилятор 2
  public diff2(value: boolean) {
    this.bus.emit("diff2", value);
  }

  //  Перепад фильтр
  public diffFilter(value: boolean) {
    this.bus.emit("diffFilter", value);
  }

  // Входная задвижка открыта/закрыта
  public supplyDamper0(value: boolean) {
    this.bus.emit("supplyDamper0", value);
  }

  // П10 задвижка открыта/закрыта
  public supplyDamper1(value: boolean) {
    this.bus.emit("supplyDamper1", value);
  }

  // П10Р задвижка открыта/закрыта
  public supplyDamper2(value: boolean) {
    this.bus.emit("supplyDamper2", value);
  }

  // Термоконтакт
  public thermalContact(value: boolean) {
    this.bus.emit("thermalContact", value);
  }

  // Пожар
  public fire(value: boolean) {
    this.bus.emit("fire", value);
  }

  // Выходные функции
  // Первая ступень нагревателя
  public electricHeaterStage1() {}
  // Привод заслонки на входе
  public damperActuatorInlet() {}
  // Привод заслонки П10
  public damperActuator1() {}
  // Привод заслонки П10Р
  public damperActuator2() {}
  // Пуск вентилятора П10
  public runFan1() {}
  // Пуск вентилятора П10Р
  public runFan2() {}
  // Вторая ступень электронагревателя
  public electricHeaterStage2() {}

  // Режимы
  public setModeRun() {}
  public setModeWork() {}
  public setModeStop() {}
  public setModePurge() {}

  // Внутренняя логика
  // Например установка и сброс ошибки или запуск вентилятора
  private async startFan1() {
    let damperResult = this.checker(await Promise.all([this.demp0.openDamper(), this.demp1.openDamper()]));
    let funResult = damperResult && this.checker(await Promise.all([this.fan1.startFun()]));
    let heaterResult = funResult && this.checker(await Promise.all([this.heater1.start()]));

    return heaterResult;
  }
  private async startFan2() {
    let damperResult = this.checker(await Promise.all([this.demp0.openDamper(), this.demp2.openDamper()]));
    let funResult = damperResult && this.checker(await Promise.all([this.fan2.startFun()]));
    let heaterResult = funResult && this.checker(await Promise.all([this.heater2.start()]));

    return heaterResult;
  }
  private async stopFan1() {
    let funResult = this.checker(await Promise.all([this.fan1.purge()]));
    let heaterResult =
      funResult &&
      this.checker(await Promise.all([this.heater1.stop(), this.demp0.closeDamper(), this.demp1.closeDamper()]));

    return heaterResult;
  }
  private async stopFan2() {
    let funResult = this.checker(await Promise.all([this.fan2.purge()]));
    let heaterResult =
      funResult &&
      this.checker(await Promise.all([this.heater2.stop(), this.demp0.closeDamper(), this.demp2.closeDamper()]));

    return heaterResult;
  }

  private async error() {}
  private async warning() {}
  private async resetErr() {}

  private checker = (result: boolean[]) => result.every((v) => v === true);
}
