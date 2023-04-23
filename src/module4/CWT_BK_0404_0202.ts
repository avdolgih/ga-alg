import Module from "./Module";
import { DiscreteInput, DiscreteOutput } from "./Port";
import Register, { DiscreteInputRegister, DiscreteOutputRegister } from "./Register";

export default class CWT_BK_04040202 extends Module {
  constructor(slaveID: number, registers: Register[]) {
    super(slaveID, registers);
  }
}

let DIReg = new DiscreteInputRegister(0, 8);
let DOReg = new DiscreteOutputRegister(0, 8);
let AIReg = new DiscreteInputRegister(0, 8);
let AOReg = new DiscreteOutputRegister(0, 8);

let DI1 = new DiscreteInput();
let DI2 = new DiscreteInput();
let DI3 = new DiscreteInput();
let DI4 = new DiscreteInput();

let DO1 = new DiscreteOutput();
let DO2 = new DiscreteOutput();
let DO3 = new DiscreteOutput();
let DO4 = new DiscreteOutput();

let AO1 = new DiscreteInput();
let AO2 = new DiscreteInput();

let AI1 = new DiscreteInput();
let AI2 = new DiscreteInput();
