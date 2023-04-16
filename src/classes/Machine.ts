export default class Machine {
  private stateList: Tstate[];
  private state: Tstate;
  constructor(stateList: Tstate[], state: Tstate) {
    this.stateList = stateList;
    this.state = state;
  }

  public getState = () => {
    return this.state;
  };

  public setState = (state: string) => {
    let _ = this.stateList.filter((_state) => {
      return _state.state === state;
    });
    if (!_.length) {
      throw new Error("Некорректные данные");
    }
    this.state = _[0];
    return this.state;
  };
}

type Tstate = {
  state: string;
  hmi: string;
};
