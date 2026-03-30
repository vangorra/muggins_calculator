declare type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

declare namespace MathJax {
  function typeset(): void;
  function typesetPromise(): Promise<void>;
  function typesetClear(): void;

  function asciimath2svg(data: string): HTMLElement;
  function asciimath2svgPromise(data: string): Promise<HTMLElement>;

  function svgStylesheet(): string;
}

declare type NonEmptyArray<T> = [T, ...T[]];
