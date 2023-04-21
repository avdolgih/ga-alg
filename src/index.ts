import Mediator, { TPublisher } from "./alg/mediator/Mediator";

import P10P10R_event from "./alg/system/P10P10R_event";
import { CWT_TM_2PT1000 } from "./devices/CWT_TM_2PT1000";
import Device from "./devices/Device";
import { CWT_BK_0404R_S } from "./devices/CWT_BK_0404R_S";
import { CWT_BK_0404R_T_SE } from "./devices/CWT_BK_0404R_T_SE";

// Определяем модули расширения

let A2 = new CWT_TM_2PT1000(1);
let A3 = new CWT_BK_0404R_T_SE(2);
let A4 = new CWT_BK_0404R_S(3);

// Переименуем регистры

A2.renameRegisters(["AI0"], ["AI1"]);
A3.renameRegisters(["DI0", "DI1", "DI2", "DI3", "DO0", "DO1", "DO2", "DO3"], ["DI1", "DI2", "DI3", "DI4", "DO1", "DO2", "DO3", "DO4"]);
A4.renameRegisters(["DI0", "DI1", "DI2", "DI3", "DO0", "DO1", "DO2", "DO3"], ["DI5", "DI6", "DI7", "DI8", "DO5", "DO6", "DO7", "DO8"]);

// Укажем какие регистры не используются в схеме, чтобы их не опрашивал модбас
A4.setInactiveRegisters(["DO8"]);

// Определяем алгоритмы
let alg = new P10P10R_event();

// Определяем посредников между модулями расширения и алгоритмами

// Посредник между регистрами контроллера и алгоритмом
class MainMediator implements Mediator {
  private devices: Device[];
  private alg: P10P10R_event;

  constructor(devices: Device[], alg: P10P10R_event) {
    this.devices = devices;
    this.devices.forEach((device) => {
      device.setMediator(this);
    });
    this.alg = alg;
  }

  // Соединяем регистры контроллера с функциями алгоритма
  public notify(publisher: TPublisher, event: string, payload: string | number | boolean): void {
    console.log({ publisher, event, payload });
    // События с модулей расширения
    if (publisher.publisherType === "device" && publisher.publisherID === 1) {
      if (event === "AI0") {
        // Температура притока
        if (typeof payload === "number") this.alg.inletTemperature(payload);
      }
      if (event === "DI1") {
        // Перепад П10
        if (typeof payload === "boolean") this.alg.diff1(payload);
      }
      if (event === "DI2") {
        // Перепат П10Р
        if (typeof payload === "boolean") this.alg.diff2(payload);
      }
      if (event === "DI3") {
        // Перепад фильтр
        if (typeof payload === "boolean") this.alg.diffFilter(payload);
      }
      if (event === "DI4") {
        // Приточная заслонка открыто
        if (typeof payload === "boolean") this.alg.supplyDamper0(payload);
      }
      if (event === "DI5") {
        // Приточная заслонка П10 открыто
        if (typeof payload === "boolean") this.alg.supplyDamper1(payload);
      }
      if (event === "DI6") {
        // Приточная заслонка П10Р открыто
        if (typeof payload === "boolean") this.alg.supplyDamper2(payload);
      }
      if (event === "DI7") {
        // Термоконтакт
        if (typeof payload === "boolean") this.alg.thermalContact(payload);
      }
      if (event === "DI8") {
        // Пожар
        if (typeof payload === "boolean") this.alg.fire(payload);
      }
    }

    // События из алгоритма
    if (publisher.publisherType === "alg") {
    }

    // События из MQTT
    if (publisher.publisherType === "MQTT") {
    }
  }
}

// Связываем модули с логическими блоками
const mediator = new MainMediator([A2, A3, A4], alg);
A3.registers[0].value = 1;
