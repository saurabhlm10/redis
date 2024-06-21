import { bulkString } from "./bulkString";

export function arrToRESP(arr: string[]) {
  const len = arr.length;

  if (len === 0) return "*0\r\n";
  return arr.reduce((acc: string, cur: string) => {
    acc += bulkString(cur);
    return acc;
  }, `*${len}\r\n`);
}
