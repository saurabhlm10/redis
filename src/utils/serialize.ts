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
  return new Uint8Array(new Buffer(str));
}
