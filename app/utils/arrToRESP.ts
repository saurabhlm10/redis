import { bulkString } from "./bulkString";

export function arrToRESP(arr: (string | null)[]) {
  const len = arr.length;

  if (len === 0) return "*0\r\n";
  return arr.reduce((acc: string, cur: string | null) => {
    acc += bulkString(cur);
    return acc;
  }, `*${len}\r\n`);
}
