import IReadable from "../observers/IReadable";
import Readable from "../observers/Readable";
import ModbusClient from "./ModbusClient";
import Module from "./Module";



export default class CWT_BK extends Module {

    private readonly client;
    readonly addr: number;
    readonly connection: IReadable<boolean> = new Readable<boolean>(() => this.update());

    readonly DI1: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DI2: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DI3: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DI4: IReadable<boolean> = new Readable<boolean>(() => this.update());

    readonly DO1: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DO2: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DO3: IReadable<boolean> = new Readable<boolean>(() => this.update());
    readonly DO4: IReadable<boolean> = new Readable<boolean>(() => this.update());

    readonly AI1: IReadable<number> = new Readable<number>(() => this.update());
    readonly AI2: IReadable<number> = new Readable<number>(() => this.update());

    readonly AO1: IReadable<number> = new Readable<number>(() => this.update());
    readonly AO2: IReadable<number> = new Readable<number>(() => this.update());

    constructor(client: ModbusClient, addr: number) {
        super();
        this.client = client;
        this.addr = addr;
    }

    async update() {
        const DI1 = <Readable<boolean>>this.DI1;
        const DI2 = <Readable<boolean>>this.DI2;
        const DI3 = <Readable<boolean>>this.DI3;
        const DI4 = <Readable<boolean>>this.DI4;
        if (DI1.isActive || DI2.isActive || DI3.isActive || DI4.isActive) {
            const bits = await this.client.readDiscreteInput(this.addr, 0, 4);
            DI1.set(bits[0]);
            DI2.set(bits[1]);
            DI3.set(bits[2]);
            DI4.set(bits[3]);
        }
    }

    async writeDO1(val: boolean) {
        const DO1 = <Readable<boolean>>this.DO1;
        const state = await this.client.writeCoil(this.addr, 0, val);
        if (state)
            DO1.set(val);
    }
}