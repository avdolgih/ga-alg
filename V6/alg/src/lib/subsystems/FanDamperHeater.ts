import Damper, { DamperMode } from "../machines/Damper";
import EventBus from "../utils/EventBus";
import FanDiff, { FanMode } from "../machines/Fan_diff";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import ElectricHeater_pid, { TElectricHeater_pidInput, HeaterElectricMode } from "../machines/ElectricHeater_pid";
import { subSystemMode } from "../utils/subSystemMode";

export default class FDH {
  private bus: EventBus;

  public fan: FanDiff;
  public damper: Damper;
  public heater: ElectricHeater_pid;
  private purgeTimeout: number;
  public readonly name: string;
  private resolver?: () => void;

  public mode: subSystemMode = subSystemMode.UNKNOWN;

  constructor(
    systemName: string,
    bus: EventBus,
    fanName: string,
    fanTimeout: number,
    fanDiffSignal: AlgDiscreteInput,
    fanStartSignal: AlgDiscreteOutput,
    damperName: string,
    damperTimeout: number,
    isOpenSignal: AlgDiscreteInput,
    openSignal: AlgDiscreteOutput,
    heaterName: string,
    heaters: TElectricHeater_pidInput[],
    purgeTimeout: number,
    k_p: number,
    k_i: number,
    settedTemperature: AlgAnalogInput,
    temperatureSignal: AlgAnalogInput,
    termalContactSignal: AlgDiscreteInput,
    pidWindow: number
  ) {
    this.name = systemName;
    this.bus = bus;
    this.fan = new FanDiff(systemName, fanName, this.bus, fanTimeout, fanDiffSignal, fanStartSignal);
    this.damper = new Damper(systemName, damperName, this.bus, damperTimeout, isOpenSignal, openSignal);

    this.heater = new ElectricHeater_pid(
      systemName,
      heaterName,
      this.bus,
      heaters,
      settedTemperature,
      temperatureSignal,
      termalContactSignal,
      pidWindow,
      k_p,
      k_i
    );
    this.purgeTimeout = purgeTimeout;
    this.bus.on("machineError", (payload) => {
      if (payload.subsitemName === this.name) {
        console.log("SUBSYSTEM ERROR", { payload });

        this.setError(payload.machine);
        this.bus.emit("error", { subsystem: this.name, machine: payload.machine, message: payload.message });
      }
    });
  }

  // Запуск системы
  public async start() {
    try {
      if (this.mode === subSystemMode.STARTING || this.mode === subSystemMode.WORKING) return;
      if (this.mode === subSystemMode.ERROR) throw new Error(`Ошибка нагревателя ${this.name}`);
      this.mode = subSystemMode.STARTING;
      await this.damper.open();
      await this.fan.start();
      this.heater.start();
      if (this.damper.mode === DamperMode.OPEN && this.fan.mode === FanMode.WORKING) this.mode = subSystemMode.WORKING;
    } catch (error) {}
  }

  // Остановка системы с продувкой
  public async stopWithPurge() {
    try {
      this.resolver && this.resolver();
      if (this.mode === subSystemMode.STOPING || this.mode === subSystemMode.WAITING) return;
      if (this.mode === subSystemMode.ERROR) return;
      this.mode = subSystemMode.STOPING;
      console.log("STOP SYSTEM", this.name);
      this.heater.stop();
      this.mode = subSystemMode.PURGING;
      await this.fan.purge(this.purgeTimeout);
      if (this.mode != subSystemMode.PURGING) return;
      this.mode = subSystemMode.STOPING;
      await this.damper.close();
      this.mode = subSystemMode.WAITING;
    } catch (error) {}
  }

  // Продувка
  public async purge() {
    try {
      if (this.mode === subSystemMode.PURGING) return;
      if (this.mode === subSystemMode.ERROR) return;
      this.mode = subSystemMode.PURGING;

      this.heater.stop();
      await this.damper.open();
      await this.fan.purge(this.purgeTimeout);
      this.mode = subSystemMode.STOPING;
      await this.damper.close();
      this.mode = subSystemMode.WAITING;
    } catch (error) {}
  }

  // Остановка системы без продувки (на случай, когда к двум системам подключен один нагреватель)
  public async stopWithoutPurge() {
    try {
      this.resolver && this.resolver();
      if (this.mode === subSystemMode.ERROR) return;
      this.mode = subSystemMode.STOPING;
      console.log("________STOP SUBSYSTEM___________");

      this.heater.stop();
      await this.fan.stop();
      if (this.mode != subSystemMode.STOPING) return;
      await this.damper.close();

      this.mode = subSystemMode.WAITING;
    } catch (error) {}
  }

  public async setError(machine: string) {
    try {
      if (this.mode === subSystemMode.ERROR) return;
      this.mode = subSystemMode.ERROR;
      if (machine === "fan") {
        this.heater.stop();
        setTimeout(() => {
          this.damper.close();
        }, 35000);
      }

      if (machine === "damper") {
        this.heater.stop();
        await this.fan.purge(this.purgeTimeout);
      }

      if (machine === "heater") {
        await this.fan.purge(this.purgeTimeout);
        await this.damper.close();
      }
    } catch (error) {}
  }

  private emitErr() {}

  public async resetErr() {
    this.fan.resetErr();
    this.damper.resetErr();
    this.heater.resetErr();
    if (
      this.fan.mode != FanMode.ERROR &&
      this.damper.mode != DamperMode.ERROR &&
      this.heater.mode != HeaterElectricMode.ERROR
    ) {
    }
    this.mode = subSystemMode.WAITING;
  }
}
