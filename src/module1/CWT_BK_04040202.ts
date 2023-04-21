import Register from "./Register";
import IReadable from "../observers/IReadable";
import IWritable from "../observers/IWritable";
import Readable from "../observers/Readable";
import Writable from "../observers/Writable";
import Module from "./Module";


export default class CWT_BK_04040202 extends Module {

    readonly addr: number;
    readonly connection: IReadable<boolean> = new Readable<boolean>(() => this.update());

    readonly DI1: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DI2: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DI3: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DI4: IReadable<boolean> = new Readable<boolean>(() => this.update());

    readonly DO1: IWritable<boolean> = new Writable<boolean>(() => this.update());
    readonly DO2: IWritable<boolean> = new Writable<boolean>(() => this.update());
    readonly DO3: IWritable<boolean> = new Writable<boolean>(() => this.update());
    readonly DO4: IWritable<boolean> = new Writable<boolean>(() => this.update());

    readonly AI1: IReadable<number> = new Readable<number>(() => this.update());
    readonly AI2: IReadable<number> = new Readable<number>(() => this.update());
    
    readonly AO1: IWritable<number> = new Writable<number>(() => this.update());
    readonly AO2: IWritable<number> = new Writable<number>(() => this.update());

    constructor(addr: number) {
        super();
        this.addr = addr;
    }

    private diReg = new Register(0, 2, (buffer) => this.updateDI(buffer));

    private update() {
        const registers: Register[] = [];

        const DI1 = (<Readable<boolean>>this.DI1).isActive;
        const DI2 = (<Readable<boolean>>this.DI2).isActive;
        const DI3 = (<Readable<boolean>>this.DI3).isActive;
        const DI4 = (<Readable<boolean>>this.DI4).isActive;
        if (DI1 || DI2 || DI3 || DI4)
            registers.push(this.diReg);

        
        super.registers = registers;
    }

    updateDI(buffer: Buffer) {
        const bits = this.getBits(buffer);
        (<Readable<boolean>>this.DI1).set(bits[0]);
        (<Readable<boolean>>this.DI2).set(bits[1]);
        (<Readable<boolean>>this.DI3).set(bits[2]);
        (<Readable<boolean>>this.DI4).set(bits[3]);
    }

    getBits(buffer: Buffer): boolean[] {
        const byte = buffer[0];
        const bits: boolean[] = [];
        buffer.forEach(val => {
            for (let i = 0; i < 8; i++)
                bits.push((0x01 & (val >> i)) ? true : false);
        })
        return bits;
    }

}