/// <reference types="vite/client" />
declare module 'utif' {
  const UTIF: {
    decode(buf: ArrayBuffer): any[];
    decodeImage(buf: ArrayBuffer, ifd: any): void;
    toRGBA8(ifd: any): Uint8Array;
  };
  export default UTIF;
}
