// Системы вентилятор - заслонка с дублированием с раздельными нагревателями

import Damper, { DamperMode } from "../machines/Damper";

import cron from "node-cron";
import ElectricHeater_pid, { HeaterElectricMode, TElectricHeater_pidInput } from "../machines/ElectricHeater_pid";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import { SystemMode, SystemStage } from "../utils/SystemMode";
import { getDay } from "../utils/utils";
import FanDiff, { FanMode } from "../machines/Fan_diff";

export default class FDH2_D_fire_purge_machine {
  public mode: SystemMode = SystemMode.HANDMODE;
  public stage: SystemStage = SystemStage.STOP;
  private bus: EventBus;
  // Подсистемы
  public inletDamper: Damper;

  public fan1: FanDiff;
  public damper1: Damper;
  public heater1: ElectricHeater_pid;

  public fan2: FanDiff;
  public damper2: Damper;
  public heater2: ElectricHeater_pid;

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
    this.bus = bus;

    this.inletTemperature.subscribe(this.tempWatcher);
    this.setTempValue = 20;

    this.inletDamper = new Damper("Общая", "Inlet", this.bus, 10000, this.supplyDamper0, this.damperActuatorInlet);

    this.fan1 = new FanDiff(subName1, fanName1, this.bus, 4000, this.diff1, this.runFan1);
    this.damper1 = new Damper(subName1, damperName1, this.bus, 4000, this.supplyDamper1, this.damperActuator1);
    this.heater1 = new ElectricHeater_pid(
      subName1,
      heaterName1,
      this.bus,
      heaters1,
      this._setTempValue,
      this.inletTemperature,
      this.thermalContact1,
      10000,
      5,
      200
    );

    this.fan2 = new FanDiff(subName2, fanName2, this.bus, 4000, this.diff2, this.runFan2);
    this.damper2 = new Damper(subName2, damperName2, this.bus, 4000, this.supplyDamper2, this.damperActuator2);
    this.heater2 = new ElectricHeater_pid(
      subName2,
      heaterName2,
      this.bus,
      heaters2,
      this._setTempValue,
      this.inletTemperature,
      this.thermalContact2,
      10000,
      5,
      200
    );

    this.fire.subscribe(this.fireStop);
    this.fire.value = true;
    // Каждый день в 12.05, если система уже работает.
    this.planner = cron.schedule("* 5 12 * *", () => {
      if (this.mode === SystemMode.AUTO) {
        this.auto();
      }
    });
    this.bus.on("error", (payload) => {
      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });

      this.setError(payload);
    });

    this.bus.on("machineError", (payload) => {
      const msg = `${payload.subsytemName}. ${payload.message}`;
      this.errorStack.push(msg);

      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: msg, topic: "ERROR" });

      this.setError(payload);
    });
  }
  // Функция-наблюдатель для температуры
  public tempWatcher = async (value: number) => {
    console.log("NEW TEMPERAUTRE");

    this.bus.emit(`MQTTSend`, { value, topic: "/heater/get" });
  };

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

  public async start() {
    try {
      await this.resetError();
      if (this.mode === SystemMode.ERROR) return;
      if (this.mode === SystemMode.HANDMODE && (this.stage === SystemStage.STARTING || this.stage === SystemStage.WORKING))
        return;
      if (this.stage === SystemStage.STOPING) return;
      this.mode = SystemMode.HANDMODE;
      this.stage = SystemStage.STARTING;

      let day = getDay();
      let isEven = day % 2 == 0;

      this.bus.emit(`MQTTSend`, { value: "START", topic: "/mode/get" });

      await this.inletDamper.open();
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.inletDamper.subsystemName}` });

      if (isEven) {
        if (this.heater2.mode === HeaterElectricMode.INPROGRESS || this.heater2.mode === HeaterElectricMode.WORKING) {
          this.heater2.stop();
          await this.damper2.open();
          await this.fan2.purge(30000);
        } else {
          this.heater2.stop();
          await this.fan2.stop();
        }

        await this.damper2.close();

        if (this.stage === SystemStage.STARTING) await this.damper1.open();
        if (this.stage === SystemStage.STARTING) await this.fan1.start();
        if (this.stage === SystemStage.STARTING) this.heater1.start();

        if (this.stage === SystemStage.STARTING) {
          this.stage = SystemStage.WORKING;
          this.bus.emit(`MQTTSend`, { value: "true", topic: this.fan1.subsystemName });
          this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan2.subsystemName });
        }
      } else {
        if (this.heater1.mode === HeaterElectricMode.INPROGRESS || this.heater1.mode === HeaterElectricMode.WORKING) {
          this.heater1.stop();

          await this.damper1.open();
          await this.fan1.purge(30000);
        } else {
          this.heater1.stop();

          await this.fan1.stop();
        }

        await this.damper1.close();

        if (this.stage === SystemStage.STARTING) await this.damper2.open();
        if (this.stage === SystemStage.STARTING) await this.fan2.start();
        if (this.stage === SystemStage.STARTING) this.heater2.start();

        if (this.stage === SystemStage.STARTING) {
          this.stage = SystemStage.WORKING;
          this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan1.subsystemName });
          this.bus.emit(`MQTTSend`, { value: "true", topic: this.fan2.subsystemName });
        }
      }
    } catch (error) {}
  }

  public async auto() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      if (this.stage === SystemStage.STOPING) return;
      this.mode = SystemMode.AUTO;
      this.stage = SystemStage.STARTING;

      let day = getDay();
      let isEven = day % 2 == 0;

      this.bus.emit(`MQTTSend`, { value: "AUTO", topic: "/mode/get" });

      await this.inletDamper.open();
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.inletDamper.subsystemName}` });

      if (isEven) {
        if (this.heater2.mode === HeaterElectricMode.INPROGRESS || this.heater2.mode === HeaterElectricMode.WORKING) {
          this.heater2.stop();

          await this.damper2.open();
          await this.fan2.purge(30000);
        } else {
          this.heater2.stop();

          await this.fan2.stop();
        }

        await this.damper2.close();

        if (this.stage === SystemStage.STARTING) await this.damper1.open();
        if (this.stage === SystemStage.STARTING) await this.fan1.start();
        if (this.stage === SystemStage.STARTING) this.heater1.start();

        if (this.stage === SystemStage.STARTING) {
          this.stage = SystemStage.WORKING;
          this.bus.emit(`MQTTSend`, { value: "true", topic: this.fan1.subsystemName });
          this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan2.subsystemName });
        }
      } else {
        if (this.heater1.mode === HeaterElectricMode.INPROGRESS || this.heater1.mode === HeaterElectricMode.WORKING) {
          this.heater1.stop();
          await this.damper1.open();
          await this.fan1.purge(30000);
        } else {
          this.heater1.stop();
          await this.fan1.stop();
        }

        await this.damper1.close();

        if (this.stage === SystemStage.STARTING) await this.damper2.open();
        if (this.stage === SystemStage.STARTING) await this.fan2.start();
        if (this.stage === SystemStage.STARTING) this.heater2.start();

        if (this.stage === SystemStage.STARTING) {
          this.stage = SystemStage.WORKING;
          this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan1.subsystemName });
          this.bus.emit(`MQTTSend`, { value: "true", topic: this.fan2.subsystemName });
        }
      }
    } catch (error) {}
  }

  public async stop() {
    try {
      if (this.mode === SystemMode.ERROR) return;
      this.bus.emit(`MQTTSend`, { value: "STOP", topic: "/mode/get" });
      this.mode === SystemMode.HANDMODE;
      this.stage = SystemStage.STOPING;
      this.inletDamper.interrupt();
      if (this.heater1.mode === HeaterElectricMode.INPROGRESS || this.heater1.mode === HeaterElectricMode.WORKING) {
        this.heater1.stop();
        this.heater2.stop();

        await this.fan2.stop();
        await this.damper2.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan2.subsystemName });

        await this.damper1.open();
        await this.fan1.purge(30000);
        await this.damper1.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan1.subsystemName });

        await this.inletDamper.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.inletDamper.subsystemName });
      } else if (this.heater2.mode === HeaterElectricMode.INPROGRESS || this.heater2.mode === HeaterElectricMode.WORKING) {
        this.heater1.stop();
        this.heater2.stop();

        await this.fan1.stop();
        await this.damper1.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan2.subsystemName });

        await this.damper2.open();
        await this.fan2.purge(30000);
        await this.damper2.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan1.subsystemName });

        await this.inletDamper.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.inletDamper.subsystemName });
      } else {
        this.heater1.stop();
        this.heater2.stop();
        this.fan1.stop();
        this.fan2.stop();
        await this.damper1.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan1.subsystemName });
        await this.damper2.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.fan2.subsystemName });
        await this.inletDamper.close();
        this.bus.emit(`MQTTSend`, { value: "false", topic: this.inletDamper.subsystemName });
      }
    } catch (error) {}
  }
  // Сброс ошибки
  public async resetError() {
    if (this.mode != SystemMode.ERROR) {
      this.bus.emit(`MQTTSend`, { value: "clear", topic: "ERROR" });
      return;
    }
    if (this.fire.value === false) return;
    this.fan1.resetErr();
    this.fan2.resetErr();
    this.damper1.resetErr();
    this.damper2.resetErr();
    this.inletDamper.resetErr();
    this.heater1.resetErr();
    this.heater2.resetErr();
    this.mode = SystemMode.HANDMODE;
    this.stage = SystemStage.STOP;
    this.bus.emit(`MQTTSend`, { value: "clear", topic: "ERROR" });
    this.errorStack = [];
  }

  // Установка ошибки
  public async setError(payload: any) {
    if (this.mode === SystemMode.ERROR) return;
    try {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan1.subsystemName}` });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan2.subsystemName}` });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.inletDamper.subsystemName}` });
      this.mode = SystemMode.ERROR;
      this.stage = SystemStage.STOPING;

      this.heater1.stop();
      this.heater2.stop();

      // В случае ошибки вентилятора пытаемся продуть нагреватель одной системы через вентилятор другой
      if (payload.machine === "fan") {
        if (this.fan1.mode === FanMode.ERROR) {
          await this.damper1.close();
          await this.damper2.open();
          await this.fan2.purge(30000);
          await this.damper2.close();
        }

        if (this.fan2.mode === FanMode.ERROR) {
          await this.damper2.close();
          await this.damper1.open();
          await this.fan1.purge(30000);
          await this.damper1.close();
        }

        await this.inletDamper.close();
      }

      if (payload.machine === "damper") {
        if (this.damper1.mode === DamperMode.ERROR) {
          await this.fan1.stop();
          await this.damper2.open();
          await this.fan2.purge(30000);
          await this.damper2.close();
          await this.inletDamper.close();
        }
        if (this.damper2.mode === DamperMode.ERROR) {
          await this.fan2.stop();
          await this.damper1.open();
          await this.fan1.purge(30000);
          await this.damper1.close();
          await this.inletDamper.close();
        }
        if (this.inletDamper.mode === DamperMode.ERROR) {
          if (this.fan1.mode === FanMode.WORKING) {
            await this.fan2.stop();
            await this.damper1.open();
            await this.fan1.purge(30000);
            await this.damper1.close();
            await this.damper2.close();
          }
          if (this.fan2.mode === FanMode.WORKING) {
            await this.fan1.stop();
            await this.damper2.open();
            await this.fan2.purge(30000);
            await this.damper1.close();
            await this.damper2.close();
          }
        }
      }

      if (payload.machine === "heater") {
        if (this.fan1.mode === FanMode.WORKING) {
          await this.fan2.stop();
          await this.damper2.close();

          await this.damper1.open();
          await this.fan1.purge(30000);
          await this.damper1.close();
        } else if (this.fan2.mode === FanMode.WORKING) {
          await this.fan1.stop();
          await this.damper1.close();

          await this.damper2.open();
          await this.fan2.purge(30000);
          await this.damper2.close();
        } else {
          await this.fan1.stop();
          await this.damper1.close();

          await this.damper2.open();
          await this.fan2.purge(30000);
          await this.damper2.close();
        }
        await this.inletDamper.close();
      }
    } catch (error) {}

    this.stage = SystemStage.STOP;
  }

  // Ошибка по пожару
  public fireStop = async (value: boolean) => {
    if (!value) {
      this.mode = SystemMode.ERROR;
      this.stage = SystemStage.STOPING;
      this.bus.emit(`MQTTSend`, { value: "Пожар", topic: "ERROR" });
      this.errorStack.push("Пожар");
      this.bus.emit(`MQTTSend`, { value: "ERROR", topic: "/mode/get" });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan1.subsystemName}` });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan2.subsystemName}` });
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.inletDamper.subsystemName}` });

      this.heater1.stop();
      if (this.fan1.mode === FanMode.WORKING) {
        await this.damper1.open();
        await this.fan1.purge(30000);
        await this.fan2.stop();
        await this.damper1.close();
        await this.damper2.close();
      }
      if (this.fan2.mode === FanMode.WORKING) {
        await this.damper2.open();
        await this.fan2.purge(30000);
        await this.fan1.stop();
        await this.damper1.close();
        await this.damper2.close();
      }
      this.inletDamper.close();
    } else {
      if (this.fan1.mode === FanMode.ERROR) return;
      if (this.fan2.mode === FanMode.ERROR) return;
      if (this.damper1.mode === DamperMode.ERROR) return;
      if (this.damper2.mode === DamperMode.ERROR) return;
      if (this.inletDamper.mode === DamperMode.ERROR) return;
      if (this.heater1.mode === HeaterElectricMode.ERROR) return;
      if (this.heater2.mode === HeaterElectricMode.ERROR) return;
      this.resetError();
    }
  };

  public getState = () => {
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

    if (this.fan1.mode === FanMode.WORKING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan1.subsystemName}` });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan1.subsystemName}` });
    }

    if (this.fan2.mode === FanMode.WORKING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: `${this.fan2.subsystemName}` });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: `${this.fan2.subsystemName}` });
    }

    if (this.inletDamper.mode === DamperMode.OPEN || this.inletDamper.mode === DamperMode.OPENING) {
      this.bus.emit(`MQTTSend`, { value: "true", topic: this.inletDamper.subsystemName });
    } else {
      this.bus.emit(`MQTTSend`, { value: "false", topic: this.inletDamper.subsystemName });
    }
  };
}
