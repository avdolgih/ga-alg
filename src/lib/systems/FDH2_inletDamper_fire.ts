// Система с двумя подсистемами задвижка/вентилятор/нагреватель с общей входной задвижкой
// TODO: Доработать ручной и авто режимы
// TODO: доработать логику сброса при пожаре
import Damper from "../machines/Damper";
import FDH from "../subsystems/fan_damper_heater";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import cron from "node-cron";
import { getDay } from "../utils/utils";

export default class FDH2_inletDamper_fire {
  public mode: SystemMode = SystemMode.WAITING;
  private bus = new EventBus();
  // Подсистемы
  private subsystem1: FDH;
  private subsystem2: FDH;
  private inletDamper: Damper;
  private planner: cron.ScheduledTask;

  // TODO: Решить вопрос с задаваемой температурой
  // Переменные
  public setTempValue: number = 20;

  constructor(subName1: string, subName2: string) {
    this.subsystem1 = new FDH(
      this.bus,
      subName1,
      10000,
      this.diff1,
      this.runFan1,
      subName1,
      30000,
      this.supplyDamper1,
      this.damperActuator1,
      subName1,
      30000,
      0.25,
      0.01,
      this.inletTemperature,
      this.thermalContact,
      this.electricHeaterStage1,
      10000
    );
    this.subsystem2 = new FDH(
      this.bus,
      subName2,
      10000,
      this.diff2,
      this.runFan2,
      subName2,
      30000,
      this.supplyDamper2,
      this.damperActuator2,
      subName2,
      30000,
      0.25,
      0.01,
      this.inletTemperature,
      this.thermalContact,
      this.electricHeaterStage2,
      10000
    );
    this.inletDamper = new Damper("Inlet", this.bus, 30000, this.supplyDamper0, this.damperActuatorInlet);
    this.fire.subscribe(this.fireLogic);

    // Каждый день в 12.05, если система уже работает.
    this.planner = cron.schedule("* 5 12 * *", () => {
      if (this.mode === (SystemMode.WORKING && SystemMode.STARTING)) {
        this.start();
      }
    });
  }

  // Входные функции
  // Температура притока
  public inletTemperature = new AlgAnalogInput();
  // Перепад вентилятор 1
  public diff1 = new AlgDiscreteInput();
  // Перепад вентилятор 2
  public diff2 = new AlgDiscreteInput();
  //  Перепад фильтр
  public diffFilter = new AlgDiscreteInput();
  // Входная задвижка открыта/закрыта
  public supplyDamper0 = new AlgDiscreteInput();
  // П10 задвижка открыта/закрыта
  public supplyDamper1 = new AlgDiscreteInput();
  // П10Р задвижка открыта/закрыта
  public supplyDamper2 = new AlgDiscreteInput();
  // Термоконтакт
  public thermalContact = new AlgDiscreteInput();
  // Пожар
  public fire = new AlgDiscreteInput();

  // Выходные функции
  // Первая ступень нагревателя
  public electricHeaterStage1 = new AlgDiscreteOutput();
  // Вторая ступень электронагревателя
  public electricHeaterStage2 = new AlgDiscreteOutput();
  // Привод заслонки на входе
  public damperActuatorInlet = new AlgDiscreteOutput();
  // Привод заслонки П10
  public damperActuator1 = new AlgDiscreteOutput();
  // Привод заслонки П10Р
  public damperActuator2 = new AlgDiscreteOutput();
  // Пуск вентилятора П10
  public runFan1 = new AlgDiscreteOutput();
  // Пуск вентилятора П10Р
  public runFan2 = new AlgDiscreteOutput();

  // Ручной старт системы
  public async start() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      let day = getDay();
      let isEven = day % 2 == 0;
      if (isEven) {
        await this.subsystem2.stop();
        await this.inletDamper.open();
        await this.subsystem1.start(this.setTempValue);
      } else {
        await this.subsystem1.stop();
        await this.inletDamper.open();
        await this.subsystem2.start(this.setTempValue);
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Старт системы авто
  public async auto() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      let day = getDay();
      let isEven = day % 2 == 0;
      this.planner.start();
      if (isEven) {
        await this.subsystem2.stop();
        await this.inletDamper.open();
        await this.subsystem1.start(this.setTempValue);
      } else {
        await this.subsystem1.stop();
        await this.inletDamper.open();
        await this.subsystem2.start(this.setTempValue);
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Остановка системы
  public async stop() {
    if (this.mode === (SystemMode.STOPING || SystemMode.WAITING || SystemMode.ERROR)) return;
    this.mode = SystemMode.STOPING;
    await Promise.all([this.subsystem1.stop(), this.subsystem2.stop()]);
    await this.inletDamper.close();
    this.mode = SystemMode.WAITING;
  }

  // Сброс ошибок
  public async resetError() {
    if (!this.fire.value) return;
    this.subsystem1.resetError();
    this.subsystem2.resetError();
    this.mode = SystemMode.WAITING;
  }

  // Логика работы с сигналом пожара
  private async fireLogic(value: boolean) {
    if (!value) {
      this.mode = SystemMode.ERROR;
      await Promise.all([this.subsystem1.stop(), this.subsystem2.stop()]);
      await this.inletDamper.close();
    }
  }
}

enum SystemMode {
  WORKING = "WORKING",
  STARTING = "STARTING",
  WAITING = "WAITING",
  STOPING = "STOPING",
  ERROR = "ERROR",
}
