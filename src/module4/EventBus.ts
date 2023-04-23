type TLisetner = {
  topic: string;
  action: (payload: any) => void;
};

export default class EventBus {
  public listeners: TLisetner[] = [];

  public on(topic: TLisetner["topic"], action: TLisetner["action"]) {
    this.listeners.push({ topic, action });
  }
  public emit(topic: string, payload: any) {
    let acitveListeners = this.listeners.filter((listener) => listener.topic === topic);
    acitveListeners.forEach((listener) => {
      listener.action(payload);
    });
    console.log(acitveListeners);
  }
}
