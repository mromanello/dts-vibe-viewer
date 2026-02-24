/**
 * Type declarations for CETEIcean library
 */

declare module 'CETEIcean' {
  export default class CETEI {
    constructor(options?: {
      ignoreFragmentId?: boolean;
      documentObject?: Document;
    });

    makeHTML5(
      xml: string,
      callback: (data: DocumentFragment) => void,
      perElementFn?: (element: Element) => void
    ): void;

    getHTML5(
      url: string,
      callback: (data: DocumentFragment) => void,
      perElementFn?: (element: Element) => void
    ): void;

    domToHTML5(
      xmlDom: Document,
      callback: (data: DocumentFragment) => void,
      perElementFn?: (element: Element) => void
    ): void;

    setBaseUrl(base: string): void;
    unsetNamespace(ns: string): void;
  }
}
