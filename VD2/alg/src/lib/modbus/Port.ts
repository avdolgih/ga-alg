import Register, {
  AnalogInputRegister,
  AnalogOutputRegister,
  DiscreteInputRegister,
  DiscreteOutputRegister,
} from "./Register";
import TreeComponent from "../utils/TreeComponent";

export default abstract class Port extends TreeComponent {
  protected parent!: Register;
  protected value: number | boolean | undefined;
  protected subscribers: Array<(value: any) => void> = [];

  // Подписка на изменения
  protected subsribe(callback: (value: number | boolean) => void) {
    this.subscribers.push(callback);
  }

  // Получить значение
  public getValue() {
    return this.value;
  }

  // Установить значение
  public setValue(value: number | boolean) {
    if (value === this.value) return;
    console.log("PORT", { value });
    this.value = value;
    this.subscribers.forEach((sub) => sub(this.value));
  }
}

// Дискретный выход
export class DiscreteOutput extends Port {
  protected parent!: DiscreteOutputRegister;
  protected value: boolean | undefined;

  // Запись дискретного выхода
  public async write(value: boolean) {
    let res = await this.parent.write(value, this);
    this.setValue(res);
    return res;
  }

  // Подписка на изменения
  public subsribe(callback: (value: boolean) => void) {
    this.subscribers.push(callback);
  }
}

// Дискретный вход
export class DiscreteInput extends Port {
  protected value: boolean | undefined;
  protected parent!: DiscreteInputRegister;

  // Подписка на изменения
  public subsribe(callback: (value: boolean) => void) {
    this.subscribers.push(callback);
  }
}

// Аналоговый выход
export class AnalogOutput extends Port {
  protected parent!: AnalogOutputRegister;
  protected value: number | undefined;
  // Запись дискретного выхода
  public async write(value: number) {
    let res = await this.parent.write(value, this);
    this.setValue(res);
    return res;
  }
  // Подписка на изменения
  public subsribe(callback: (value: number) => void) {
    this.subscribers.push(callback);
  }
}

// Аналоговый вход
export class AnalogInput extends Port {
  protected value: number | undefined;
  protected parent!: AnalogInputRegister;
  // Подписка на изменения
  public subsribe(callback: (value: number) => void) {
    this.subscribers.push(callback);
  }
}
