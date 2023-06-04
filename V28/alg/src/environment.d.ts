export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HEALTH: boolean;
    }
  }
}
