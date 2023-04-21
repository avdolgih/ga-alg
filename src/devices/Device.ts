import BaseComponent from "../alg/mediator/baseComponent";
import IRegister from "./Register";

export default abstract class Device extends BaseComponent {
  public readonly slaveID: number;
  public readonly registers: IRegister[];
  public readonly name: string;
  constructor(name: string, slaveID: number, registers: IRegister[]) {
    super();
    this.name = name;
    this.slaveID = slaveID;
    this.registers = registers;
  }
  public update(value: number, name: string): void {
    this.mediator.notify({ publisherType: "device", publisherID: this.slaveID }, name, value);
  }
  public renameRegisters(names: string[], pseudonyms: string[]) {
    names.forEach((name, index) => {
      let register = this.registers.find((reg) => reg.name === name);
      if (register) {
        register.name = pseudonyms[index];
      } else {
        console.log("ОШИБКА, РЕГИСТР ДЛЯ ПЕРЕИМЕНОВЫВАНИЯ НЕ НАЙДЕН");
      }
    });
    // Сортируем после переименовывания
    this.registers.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  }

  public setInactiveRegisters(names: string[]) {
    names.forEach((name, index) => {
      let register = this.registers.find((reg) => reg.name === name);
      if (register) {
        register.isActive = false;
      } else {
        console.log("ОШИБКА, РЕГИСТР ДЛЯ ДЕАКТИВАЦИИ НЕ НАЙДЕН");
      }
    });
    // Сортируем после переименовывания
    this.registers.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  }
}
