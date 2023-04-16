import IRegister from "./Register";

export default class Device {
    
    public readonly registers: IRegister[];

    constructor(registers : IRegister[]) {
        this.registers = registers;
    }
}