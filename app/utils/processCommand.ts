export function processCommand(
  command: string,
  args: (string | null)[],
  values: Map<string, string>
) {
  switch (command.toLowerCase()) {
    case "set":
      if (args[0] && args[1]) {
        if (args[2]?.toLowerCase() === "px") {
          setTimeout(() => {
            values.delete(args[0] as string);
          }, Number(args[3]));
        }
        values.set(args[0], args[1]);
      }
      break;
    default:
      console.log("`Unhandled write command: ${command}`");
  }
}
