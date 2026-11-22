/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PREVIEW: string;
  readonly VITE_WAITLIST_FORM_URL?: string;
  readonly VITE_WAITLIST_EMAIL_FIELD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
