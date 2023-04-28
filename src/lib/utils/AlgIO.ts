import { AnalogInput, AnalogOutput, DiscreteInput, DiscreteOutput } from "../modbus/Port";

// class AlgInput {
//   private algFunction: () => void;
//   private DeviceOutputPort: DiscreteInput | AnalogInput;
//   constructor(algFunction: () => void, DeviceOutput: () => void) {}
// }

// Выход из алгоритма на дискретный выход
export class AlgDiscreteOutput {
  private port?: DiscreteOutput;
  private _value: boolean = false;

  set value(value: boolean) {
    this._value = value;
    this.notify();
  }

  get value() {
    return this._value;
  }

  public connectPort(port: DiscreteOutput) {
    this.port = port;
  }

  private notify() {
    this.port?.setValue(this._value);
  }
}

// Выход из алгоритма на аналоговый выход
export class AlgAnalogOutput {
  private port?: AnalogOutput;
  private _value: number = 0;

  set value(value: number) {
    this._value = value;
    this.notify();
  }

  get value() {
    return this._value;
  }

  public connectPort(port: AnalogOutput) {
    this.port = port;
  }

  private notify() {
    this.port?.setValue(this._value);
  }
}

// Вход с дискретного входа на алгоритм
export class AlgDiscreteInput {
  private port?: DiscreteInput;
  private _value: boolean = false;
  private subscribers: Array<(value: boolean) => void> = [];

  public connectPort(port: DiscreteInput) {
    this.port = port;
    this.port.subsribe((value) => {
      this._value = value;
      this.subscribers.forEach((sub) => {
        sub(this._value);
      });
    });
  }

  public subscribe(callback: (value: boolean) => void) {
    this.subscribers.push(callback);
  }

  get value() {
    return this._value;
  }

  set value(value: boolean) {
    this._value = value;
    this.subscribers.forEach((sub) => {
      sub(value);
    });
  }
}

// Вход с аналогового входа на алгоритм
export class AlgAnalogInput {
  private port?: AnalogInput;
  private _value: number = 0;
  private subscribers: Array<(value: number) => void> = [];

  public connectPort(port: AnalogInput) {
    this.port = port;
    this.port.subsribe((value) => {
      this._value = value;
      this.subscribers.forEach((sub) => {
        sub(this._value);
      });
    });
  }
  public subscribe(callback: (value: number) => void) {
    this.subscribers.push(callback);
  }
  get value() {
    return this._value;
  }
  set value(value: number) {
    this._value = value;
    this.subscribers.forEach((sub) => {
      sub(value);
    });
  }
}
