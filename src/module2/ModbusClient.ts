
import ModbusRTU from "modbus-serial";

export default class ModbusClient {
    private readonly client: ModbusRTU = new ModbusRTU();

    constructor(port: string, rate: Rate) {
        this.client.connectRTU(port, { baudRate: rate });
        this.client.setTimeout(100);
    }

    async readDiscreteInput(id: number, addr: number, len: number) {
        this.client.setID(id);
        const res = await this.client.readDiscreteInputs(addr, len);
        return this.getBits(res.buffer);
    }

    async writeCoil(id: number, addr: number, val: boolean) {
        this.client.setID(id);
        const res = await this.client.writeCoil(addr, val);
        return res.state;
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

export enum Rate {
    r9600 = 9600,
    r19200 = 19200,
    r115200 = 115200
}
