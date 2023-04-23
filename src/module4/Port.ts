import Register, {
  AnalogInputRegister,
  AnalogOutputRegister,
  DiscreteInputRegister,
  DiscreteOutputRegister,
} from "./Register";
import TreeComponent from "./TreeComponent";

export default abstract class Port extends TreeComponent {
  protected parent!: Register;
  private value: number | boolean | undefined;
  private subscribers: Array<(value: number | boolean | undefined) => void> = [];

  // Подписка на изменения
  public subsribe(callback: (value: number | boolean | undefined) => void) {
    this.subscribers.push(callback);
  }

  // Получить значение
  public getValue() {
    return this.value;
  }

  // Установить значение
  public setValue(value: number | boolean) {
    this.value = value;
    this.subscribers.forEach((sub) => sub(this.value));
  }
}

// Дискретный выход
export class DiscreteOutput extends Port {
  protected parent!: DiscreteOutputRegister;
  // Запись дискретного выхода
  public async write(value: boolean) {
    let res = await this.parent.write(value);
    this.setValue(res);
    return res;
  }
}

// Дискретный вход
export class DiscreteInput extends Port {
  protected parent!: DiscreteInputRegister;
}

// Аналоговый выход
export class AnalogOutput extends Port {
  protected parent!: AnalogOutputRegister;
  // Запись дискретного выхода
  public async write(value: number) {
    let res = await this.parent.write(value);
    this.setValue(res);
    return res;
  }
}

// Аналоговый вход
export class AnalogInput extends Port {
  protected parent!: AnalogInputRegister;
}
