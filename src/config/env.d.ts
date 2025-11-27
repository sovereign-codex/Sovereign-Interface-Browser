/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_GPT_ENDPOINT?: string;
    readonly VITE_APP_NAME?: string;
  }
}
