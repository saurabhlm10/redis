export function parseRESP(data: string): {
  command: string;
  args: (string | null)[];
} {
  const input = data.toString();
  const lines = input.split("\r\n");
  let command = "";
  const args: (string | null)[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i][0] === "*") {
      continue; // Skip the array length line
    } else if (lines[i][0] === "$") {
      const length = parseInt(lines[i].substring(1), 10);
      if (length === -1) {
        args.push(null); // Null bulk string
      } else if (i + 1 < lines.length) {
        if (command === "") {
          command = lines[i + 1];
        } else {
          args.push(lines[i + 1]);
        }
        i++; // Skip the next line as it's part of the bulk string
      }
    }
  }
  return { command: command.toLowerCase(), args };
}
