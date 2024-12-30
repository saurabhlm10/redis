export function serializeSimpleString(value: string) {
  const str = `+${value}\r\n`;

  return new Uint8Array(Buffer.from(str));
}

export function serializeBulkString(value: string) {
  if (!value.length) {
    const str = "$-1\r\n";

    return new Uint8Array(Buffer.from(str));
  }

  const str = `$${value.length}\r\n${value}\r\n`;

  return new Uint8Array(Buffer.from(str));
}

export function serializeSimpleError(value: string) {
  const str = `-${value}\r\n`;
  return new Uint8Array(Buffer.from(str));
}

export function serializeArray(...args: Uint8Array[]) {
  let str = `*${args.length}\r\n`;
  const buffer = new Uint8Array(Buffer.from(str));

  const length = buffer.length + args.reduce((acc, el) => acc + el.length, 0);
  const newBuffer = new Uint8Array(length);

  let offset = 0;

  [buffer, ...args].forEach((arr) => {
    newBuffer.set(arr, offset);
    offset += arr.length;
  });

  return newBuffer;
}
