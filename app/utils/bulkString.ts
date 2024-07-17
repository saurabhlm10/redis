export const bulkString = (reply: string | null | undefined): string =>
  reply === null || reply === undefined
    ? "$-1\r\n"
    : `$${reply.length}\r\n${reply}\r\n`;
