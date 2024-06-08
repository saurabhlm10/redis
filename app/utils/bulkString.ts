export const bulkString = (reply?: string) =>
  reply ? `$${reply.length}\r\n${reply}\r\n` : "$-1\r\n";
