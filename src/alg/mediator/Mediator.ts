export default interface Mediator {
  notify(publisher: TPublisher, event: string, payload: string | number): void;
}

export type TPublisher = {
  publisherType: string;
  publisherID: number;
};
