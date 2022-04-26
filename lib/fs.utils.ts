import fs from "fs";
import {RmOptions} from "node:fs";

export function filePathExists(filePath: string): Promise<boolean> {
  return fs.promises.stat(filePath)
    .then(() => true)
    .catch(() => false);
}

export async function rmIfExists(filePath: string, options?: RmOptions): Promise<void> {
  if (!await filePathExists(filePath)) {
    return;
  }

  return fs.promises.rm(filePath, options);
}
