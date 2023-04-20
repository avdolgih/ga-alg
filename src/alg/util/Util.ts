export default class Util {
    public getDay() {
        const date = new Date();
        const offset = date.getTimezoneOffset() * 60000;
        const day = (date.getTime() - offset) / 86400000;
        return Math.trunc(day);
    }
}