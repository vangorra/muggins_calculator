export interface Config {
  boardMinNumber: number;
  boardMaxNumber: number;
  diceCount: number;
  operations: Operation[];
}

export interface Die {
  selectedFaceCount: number;
  selectedFace: number;
}

export interface Operation {
  name: string;
  operationFunction: (a: number, b: number) => number;
  operator: string;
}
