import Damper, { DamperMode } from "../machines/Damper";
import HeaterElectric, { HeaterElectricMode } from "../machines/ElectricHeater";
import EventBus from "../utils/EventBus";
import Fan, { FanMode } from "../machines/Fan_diff";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";

export default class FDH {
  private bus: EventBus;

  private fan: Fan;
  private damper: Damper;
  private heater: HeaterElectric;
  private purgeTimeout: number;

  private mode: subSystemMode = subSystemMode.UNKNOWN;

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
    purgeTimeout: number,
    k_p: number,
    k_i: number,
    temperatureSignal: AlgAnalogInput,
    termalContactSignal: AlgDiscreteInput,
    controlSignal: AlgDiscreteOutput,
    pidWindow: number
  ) {
    this.bus = bus;
    this.fan = new Fan(fanName, this.bus, fanTimeout, fanDiffSignal, fanStartSignal);
    this.damper = new Damper(damperName, this.bus, damperTimeout, isOpenSignal, openSignal);
    this.heater = new HeaterElectric(
      heaterName,
      this.bus,
      k_p,
      k_i,
      temperatureSignal,
      termalContactSignal,
      controlSignal,
      pidWindow
    );
    this.purgeTimeout = purgeTimeout;
    this.bus.on("error", () => {
      this.setError();
    });
  }

  public async start(temperature: number) {
    try {
      if (this.mode === (subSystemMode.STARTING && subSystemMode.WORKING && subSystemMode.ERROR)) return;
      this.mode = subSystemMode.STARTING;
      await this.damper.open();
      await this.fan.start();
      await this.heater.start(temperature);
      this.mode = subSystemMode.WORKING;
    } catch (error) {}
  }
  public async stop() {
    try {
      if (this.mode === (subSystemMode.STOPING && subSystemMode.WAITING && subSystemMode.ERROR)) return;
      await this.purge();
      this.mode = subSystemMode.STOPING;
      await this.damper.close();
      this.mode = subSystemMode.WAITING;
    } catch (error) {}
  }
  public async purge() {
    try {
      if (this.mode === subSystemMode.PURGING && subSystemMode.ERROR) return;
      this.mode = subSystemMode.PURGING;
      await this.heater.stop();
      await this.fan.purge(this.purgeTimeout);
    } catch (error) {}
  }

  // TODO: написать логику остановки
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

enum subSystemMode {
  WORKING = "WORKING",
  STARTING = "STARTING",
  PURGING = "PURGING",
  STOPING = "STOPING",
  WAITING = "WAITING",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
