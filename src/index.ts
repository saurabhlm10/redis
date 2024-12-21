import * as net from "net";
import { parse } from "./utils/parse";
import {
  serializeSimpleError,
  serializeBulkString,
  serializeSimpleString,
} from "./utils/serialize";

const commands = {
  PING: () => serializeSimpleString("PONG"),
  ECHO: (arg: string) => serializeBulkString(arg),
};

const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on("data", (data) => {
    const [input] = parse(data);

    switch ((input[0] as string).toUpperCase()) {
      case "PING":
        connection.write(commands.PING());
        break;
      case "ECHO":
        connection.write(commands.ECHO(input[1] as string));
        break;
      default:
        // throw Error(`Unknown command: ${input[0]}`);
        connection.write(serializeSimpleError(`Unknown command: ${input[0]}`));
    }
  });
});

server.listen(6379, "127.0.0.1");
