import Damper, { DamperMode } from "../machines/Damper";
import EventBus from "../utils/EventBus";
import FanDiff, { FanMode } from "../machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";

export default class FD {
  private bus: EventBus;

  private fan: FanDiff;
  private damper: Damper;

  private mode: subSystemMode = subSystemMode.UNKNOWN;
  public readonly name: string;

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
    openSignal: AlgDiscreteOutput
  ) {
    this.name = systemName;
    this.bus = bus;
    this.fan = new FanDiff(systemName, fanName, this.bus, fanTimeout, fanDiffSignal, fanStartSignal);
    this.damper = new Damper(systemName, damperName, this.bus, damperTimeout, isOpenSignal, openSignal);

    this.bus.on("machineError", (payload) => {
      this.setError();
      this.bus.emit("error", { machine: payload.machine });
    });
  }

  public async start() {
    try {
      if (this.mode === subSystemMode.ERROR) return;
      if (this.mode === subSystemMode.STARTING || this.mode === subSystemMode.WORKING) return;
      this.mode = subSystemMode.STARTING;
      await this.damper.open();
      await this.fan.start();
      this.mode = subSystemMode.WORKING;
    } catch (error) {}
  }

  public async stop() {
    try {
      if (this.mode === subSystemMode.ERROR) return;
      if (this.mode === subSystemMode.STOPING || this.mode === subSystemMode.WAITING) return;
      this.mode = subSystemMode.STOPING;
      await this.fan.stop();
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
      await this.damper.open();
      await this.fan.purge(30000);
      await this.damper.close();
    } catch (error) {}
  }

  public async setError() {
    if (this.mode === subSystemMode.ERROR) return;
    this.fan.stop();
    this.damper.close();
    this.mode = subSystemMode.ERROR;
  }

  public async resetError() {
    this.fan.resetErr();
    this.damper.resetErr();
    if (this.fan.mode != FanMode.ERROR && this.damper.mode != DamperMode.ERROR) {
    }
    this.mode = subSystemMode.WAITING;
  }
}

enum subSystemMode {
  WORKING = "WORKING",
  STARTING = "STARTING",
  STOPING = "STOPING",
  WAITING = "WAITING",
  PURGING = "PURGING",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
