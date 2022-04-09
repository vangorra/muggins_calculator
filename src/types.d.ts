declare type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

declare namespace MathJax {
  function typeset(): void;
  function typesetPromise(): Promise<void>;
  function typesetClear(): void;

  function asciimath2svg(data: string): string;
  function asciimath2svgPromise(data: string): Promise<string>;

  function svgStylesheet(): string;
}
