import * as net from "net";
import { parse } from "./utils/parse";
import { serialazeSimpleError, serializeSimpleString } from "./utils/serialize";

const commands = {
  PING: () => serializeSimpleString("PONG"),
};

const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on("data", (data) => {
    const [input] = parse(data);

    switch ((input[0] as string).toUpperCase()) {
      case "PING":
        connection.write(commands.PING());
        break;
      default:
        // throw Error(`Unknown command: ${input[0]}`);
        connection.write(serialazeSimpleError(`Unknown command: ${input[0]}`));
    }
  });
});

server.listen(6379, "127.0.0.1");
