declare namespace MathJax {
  function typeset(): void;
}

export class MathJaxUtils {
  static isMathJaxInitialized(): boolean {
    return !!MathJax.typeset;
  }

  static typeset(): void {
    if (MathJaxUtils.isMathJaxInitialized()) {
      MathJax.typeset();
    }
  }
}
