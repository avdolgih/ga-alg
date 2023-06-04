// Системы вентилятор - заслонка с дублированием с раздельными нагревателями
import Damper, { DamperMode } from "../machines/Damper";
import FDH from "../subsystems/FanDamperHeater";

import cron from "node-cron";
import { TElectricHeater_pidInput } from "../machines/ElectricHeater_pid";
import { AlgAnalogInput, AlgAnalogOutput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import { SystemMode, SystemStage } from "../utils/SystemMode";
import { subSystemMode } from "../utils/subSystemMode";
import { getDay } from "../utils/utils";

export default class FD2H_D_fire_purge {
  public mode: SystemMode = SystemMode.HANDMODE;
  public stage: SystemStage = SystemStage.STOP;
  private bus: EventBus;
  // Подсистемы
  public subsystem1: FDH;
  public subsystem2: FDH;
  public inletDamper: Damper;
  private planner: cron.ScheduledTask;
  readonly systemName: string;

  private errorStack: string[] = [];

  public heaterControllers1: AlgDiscreteOutput[] = [];
  public heaterControllers2: AlgDiscreteOutput[] = [];
  constructor(
    systemName: string,
    subName1: string,
    fanName1: string,
    damperName1: string,
    heaterName1: string,
    subName2: string,
    fanName2: string,
    damperName2: string,
    heaterName2: string,
    bus: EventBus,
    heatersSettings1: Array<TElectricHeater_pidInput["regulationMode"]>,
    heatersSettings2: Array<TElectricHeater_pidInput["regulationMode"]>
  ) {
    let heaters1: TElectricHeater_pidInput[] = [];
    let heaters2: TElectricHeater_pidInput[] = [];

    heatersSettings1.forEach((setting) => {
      let heaterControl: TElectricHeater_pidInput["controlSignal"] = new AlgDiscreteOutput();
      this.heaterControllers1.push(heaterControl);
      heaters1.push({ controlSignal: heaterControl, regulationMode: setting });
    });

    heatersSettings2.forEach((setting) => {
      let heaterControl: TElectricHeater_pidInput["controlSignal"] = new AlgDiscreteOutput();
      this.heaterControllers2.push(heaterControl);
      heaters2.push({ controlSignal: heaterControl, regulationMode: setting });
    });

    this.systemName = systemName;
    this.bus = new EventBus();
    this.subsystem1 = new FDH(
      subName1,
      this.bus,
      fanName1,
      10000,
      this.diff1,
      this.runFan1,
      damperName1,
      30000,
      this.supplyDamper1,
      this.damperActuator1,
      heaterName1,
      heaters1,
      30000,
      5,
      200,
      this._setTempValue,
      this.inletTemperature,
      this.thermalContact1,
      10000
    );
    this.subsystem2 = new FDH(
      subName2,
      this.bus,
      fanName2,
      10000,
      this.diff2,
      this.runFan2,
      damperName2,
      30000,
      this.supplyDamper2,
      this.damperActuator2,
      heaterName2,
      heaters2,
      30000,
      5,
      200,
      this._setTempValue,
      this.inletTemperature,
      this.thermalContact2,
      10000
    );

    this.inletDamper = new Damper("general", "Inlet", this.bus, 30000, this.supplyDamper0, this.damperActuatorInlet);

    this.fire.subscribe(this.fireStop);

    // Каждый день в 12.05, если система уже работает.
    this.planner = cron.schedule("* 5 12 * *", () => {
      if (this.mode === SystemMode.AUTO) {
        this.auto();
      }
    });
    this.bus.on("error", (payload) => {
      this.setError(payload);
    });

    this.bus.on("mahineError", (payload) => {
      this.setError(payload);
    });
  }

  // Переменные
  private _setTempValue: AlgAnalogInput = new AlgAnalogInput();

  public set setTempValue(value: number) {
    console.log({ value });

    if (value < 15 || value > 35) {
      this.bus.emit(`MQTTSend`, { value: this._setTempValue, topic: "/heater/mode/get" });
      return;
    }
    this._setTempValue.value = value;
    this.bus.emit(`MQTTSend`, { value, topic: "/heater/mode/get" });
  }

  public get setTempValue() {
    return this._setTempValue.value;
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
  public thermalContact1 = new AlgDiscreteInput();
  // Термоконтакт
  public thermalContact2 = new AlgDiscreteInput();
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

  // ---------------------------------------------------------------------------------
  // Ручной пуск
  public async start() {
    try {
      await this.resetError();
      if (this.mode === SystemMode.ERROR) return;
      if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STARTING || this.stage === SystemStage.WORKING))
        return;
      this.mode = SystemMode.HANDMODE;
      this.stage = SystemStage.STARTING;
      let day = getDay();
      let isEven = day % 2 == 0;
      if (isEven) {
        await this.inletDamper.open();
        await Promise.all([await this.subsystem1.stopWithPurge(), await this.subsystem2.start()]);
      } else {
        await this.inletDamper.open();
        await Promise.all([await this.subsystem2.stopWithPurge(), await this.subsystem1.start()]);
      }
      if (this.subsystem1.mode === subSystemMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "START", topic: "/mode/get" });
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.subsystem1.name}` });
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.subsystem2.name}` });
      }
      if (this.subsystem2.mode === subSystemMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "START", topic: "/mode/get" });
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.subsystem1.name}` });
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.subsystem2.name}` });
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Остановка с выводом в ручной режим
  public async stop() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      this.mode = SystemMode.HANDMODE;
      if (this.stage === SystemStage.STOP || this.stage === SystemStage.STOPING) return;

      this.stage = SystemStage.STOPING;
      await Promise.all([this.subsystem1.stopWithPurge(), this.subsystem1.stopWithPurge()]);
      await this.inletDamper.close();
      this.stage = SystemStage.STOP;
      this.bus.emit(`MQTTSend`, { value: "STOP", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.subsystem1.name}` });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.subsystem2.name}` });
    } catch (error) {
      console.log(error);
    }
  }

  // Пуск авто
  public async auto() {
    try {
      if (this.mode === SystemMode.ERROR) return;

      this.mode = SystemMode.AUTO;
      this.stage = SystemStage.STARTING;
      let day = getDay();
      let isEven = day % 2 == 0;
      if (isEven) {
        await this.inletDamper.open();
        await Promise.all([await this.subsystem1.stopWithPurge(), await this.subsystem2.start()]);
      } else {
        await this.inletDamper.open();
        await Promise.all([await this.subsystem2.stopWithPurge(), await this.subsystem1.start()]);
      }

      if (!this.fire.value) return;

      if (this.subsystem1.mode === subSystemMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "AUTO", topic: "/mode/get" });
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.subsystem1.name}` });
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.subsystem2.name}` });
      }
      if (this.subsystem2.mode === subSystemMode.WORKING) {
        this.stage = SystemStage.WORKING;
        this.bus.emit(`MQTTSend`, { value: "AUTO", topic: "/mode/get" });
        this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.subsystem1.name}` });
        this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.subsystem2.name}` });
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Сброс ошибки
  public async resetError() {
    if (this.mode != SystemMode.ERROR) return;
    if (this.fire.value === false) return;
    this.subsystem1.resetErr();
    this.subsystem2.resetErr();
    this.inletDamper.resetErr();
    this.mode = SystemMode.HANDMODE;
    this.stage = SystemStage.STOP;
  }

  // Установка ошибки
  public async setError(payload: any) {
    this.mode = SystemMode.ERROR;
    this.stage = SystemStage.STOPING;

    // В случае ошибки вентилятора пытаемся продуть нагреватель одной системы через вентилятор другой
    if (payload.machine === "fan") {
      // Продувка сработает только на одной системе т.к. вторая уйдет в ошибку
      await this.subsystem1.purge();
      await this.subsystem2.purge();
      await this.inletDamper.close();
    }

    if (payload.machine === "damper") {
      await this.subsystem1.stopWithPurge();
      await this.subsystem2.stopWithPurge();
      await this.inletDamper.close();
    }

    if (payload.machine === "heater") {
      // Продувка сработает только на одной системе т.к. вторая уйдет в ошибку
      await this.subsystem1.stopWithPurge();
      await this.subsystem2.stopWithPurge();
      await this.inletDamper.close();
    }

    this.stage = SystemStage.STOP;
  }

  // Ошибка по пожару
  public fireStop = async (value: boolean) => {
    if (!value) {
      this.mode = SystemMode.ERROR;
      this.stage = SystemStage.STOPING;
      if (this.subsystem1.mode === subSystemMode.STARTING || this.subsystem1.mode === subSystemMode.WORKING) {
        await this.subsystem1.stopWithPurge();
      } else {
        await this.subsystem1.stopWithoutPurge();
      }
      if (this.subsystem2.mode === subSystemMode.STARTING || this.subsystem2.mode === subSystemMode.WORKING) {
        await this.subsystem2.stopWithPurge();
      } else {
        await this.subsystem2.stopWithoutPurge();
      }
      await this.inletDamper.close();

      this.stage = SystemStage.STOP;
    } else {
      if (this.subsystem1.mode === subSystemMode.ERROR || this.subsystem2.mode === subSystemMode.ERROR) return;
      this.resetError();
    }
  };

  public getState = () => {
    console.log(this.errorStack);

    this.bus.emit(`MQTTSend`, { value: this.inletTemperature.value, topic: "/heater/get" });
    this.bus.emit(`MQTTSend`, { value: this.setTempValue, topic: "/heater/mode/get" });

    this.errorStack.forEach((error) => {
      this.bus.emit(`MQTTSend`, { value: error, topic: "ERROR" });
    });

    if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STARTING || this.stage === SystemStage.WORKING))
      this.bus.emit(`MQTTSend`, { value: "START", topic: "/mode/get" });
    if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STOPING || this.stage === SystemStage.STOP)) {
      this.bus.emit(`MQTTSend`, { value: "STOP", topic: "/mode/get" });
    }
    if (this.mode === SystemMode.AUTO) this.bus.emit(`MQTTSend`, { value: "AUTO", topic: "/mode/get" });
    if (this.mode === SystemMode.ERROR) this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });

    if (this.subsystem1.mode === subSystemMode.WORKING || this.subsystem1.mode === subSystemMode.STARTING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.subsystem1.name}` });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.subsystem1.name}` });
    }

    if (this.subsystem2.mode === subSystemMode.WORKING || this.subsystem2.mode === subSystemMode.STARTING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.subsystem2.name}` });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.subsystem2.name}` });
    }

    if (this.inletDamper.mode === DamperMode.OPEN || this.inletDamper.mode === DamperMode.OPENING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: this.inletDamper.subsystemName });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: this.inletDamper.subsystemName });
    }
  };
}
