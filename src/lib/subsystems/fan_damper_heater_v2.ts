import Damper, { DamperMode } from "../machines/Damper";
import EventBus from "../utils/EventBus";
import Fan, { FanMode } from "../machines/Fan_diff";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import ElectricHeater_pid, { TElectricHeater_pidInput, HeaterElectricMode } from "./ElectricHeater_pid";
import { subSystemMode } from "../utils/subSystemMode";

export default class FDH {
  private bus: EventBus;

  private fan: Fan;
  private damper: Damper;
  private heater: ElectricHeater_pid;
  private purgeTimeout: number;

  public mode: subSystemMode = subSystemMode.UNKNOWN;

  constructor(
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
    temperatureSignal: AlgAnalogInput,
    termalContactSignal: AlgDiscreteInput,
    pidWindow: number
  ) {
    this.bus = bus;
    this.fan = new Fan(fanName, this.bus, fanTimeout, fanDiffSignal, fanStartSignal);
    this.damper = new Damper(damperName, this.bus, damperTimeout, isOpenSignal, openSignal);

    this.heater = new ElectricHeater_pid(
      heaterName,
      this.bus,
      heaters,
      temperatureSignal,
      termalContactSignal,
      pidWindow,
      k_p,
      k_i
    );
    this.purgeTimeout = purgeTimeout;
    this.bus.on("error", () => {
      this.setError();
    });
  }

  // Запуск системы
  public async start(temperature: number) {
    try {
      if (this.mode === (subSystemMode.STARTING && subSystemMode.WORKING && subSystemMode.ERROR)) return;
      this.mode = subSystemMode.STARTING;
      console.log("STARTING SYSTEM");
      await this.damper.open();
      console.log("STARTING FAN");
      await this.fan.start();
      console.log("STARTING FAN");
      this.heater.start(temperature);
      this.mode = subSystemMode.WORKING;
      console.log(this.mode);
    } catch (error) {}
  }

  // Остановка системы с продувкой
  public async stop() {
    try {
      if (this.mode === (subSystemMode.STOPING && subSystemMode.WAITING && subSystemMode.ERROR)) return;
      await this.purge();
      this.mode = subSystemMode.STOPING;
      await this.damper.close();
      this.mode = subSystemMode.WAITING;
    } catch (error) {}
  }

  // Остановка системы без продувки (на случай, когда к двум системам подключен один нагреватель)
  public async stopWithoutPurge() {
    try {
      if (this.mode === (subSystemMode.STOPING && subSystemMode.WAITING && subSystemMode.ERROR)) return;
      this.mode = subSystemMode.STOPING;
      await this.damper.close();
      await this.fan.stop();
      this.mode = subSystemMode.WAITING;
    } catch (error) {}
  }

  // Продувка
  public async purge() {
    try {
      if (this.mode === subSystemMode.PURGING && subSystemMode.ERROR) return;
      this.mode = subSystemMode.PURGING;
      await this.heater.stop();
      await this.fan.purge(this.purgeTimeout);
    } catch (error) {}
  }

  // TODO: написать логику экстренной остановки
  public async setError() {
    if (this.mode != subSystemMode.ERROR) {
      this.mode = subSystemMode.ERROR;
    }
  }

  public async resetError() {
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
