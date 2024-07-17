export function isWriteCommand(command: string): boolean {
  const writeCommands = [
    "set",
    "del",
    "incr",
    "decr",
    "lpush",
    "rpush",
    "sadd",
    "srem",
    "zadd",
    "zrem",
  ];
  return writeCommands.includes(command.toLowerCase());
}
