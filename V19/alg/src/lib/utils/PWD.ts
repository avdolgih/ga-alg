import { AlgDiscreteOutput } from "./AlgIO";

export default class PWD {
  private window: number;
  private interval?: NodeJS.Timer;
  private timerLow?: NodeJS.Timer;
  private outputSignal: AlgDiscreteOutput;

  constructor(window: number, signal: AlgDiscreteOutput) {
    this.window = window;
    this.outputSignal = signal;
  }

  public start(input: number) {
    clearInterval(this.interval);
    clearTimeout(this.timerLow);

    this.control(input);
    this.interval = setInterval(() => {
      this.control(input);
    }, this.window);
  }

  private control = (input: number) => {
    this.outputSignal.value = true;
    this.timerLow = setTimeout(() => {
      this.outputSignal.value = false;
    }, this.window * (1 - input / 100));
  };

  public stop() {
    clearInterval(this.interval);
    clearTimeout(this.timerLow);
    this.outputSignal.value = false;
  }
}
