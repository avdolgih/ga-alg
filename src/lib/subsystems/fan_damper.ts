import Damper, { DamperMode } from "../machines/Damper";
import EventBus from "../utils/EventBus";
import Fan, { FanMode } from "../machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";

export default class FD {
  private bus: EventBus;

  private fan: Fan;
  private damper: Damper;

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
    openSignal: AlgDiscreteOutput
  ) {
    this.bus = bus;
    this.fan = new Fan(fanName, this.bus, fanTimeout, fanDiffSignal, fanStartSignal);
    this.damper = new Damper(damperName, this.bus, damperTimeout, isOpenSignal, openSignal);

    this.bus.on("error", () => {
      this.setError();
    });
  }

  public async start() {
    try {
      if (this.mode === (subSystemMode.STARTING && subSystemMode.WORKING && subSystemMode.ERROR)) return;
      this.mode = subSystemMode.STARTING;
      await this.damper.open();
      await this.fan.start();
      this.mode = subSystemMode.WORKING;
    } catch (error) {}
  }
  public async stop() {
    try {
      if (this.mode === (subSystemMode.STOPING && subSystemMode.WAITING && subSystemMode.ERROR)) return;
      this.mode = subSystemMode.STOPING;
      await this.damper.close();
      this.mode = subSystemMode.WAITING;
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
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}
