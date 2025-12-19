/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_URL?: string;
  readonly VITE_APP_PUBLIC_URL?: string;
  readonly APP_PUBLIC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


declare module "*.svg" {
  const value: string;
  export default value;
}
