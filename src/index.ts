import * as net from "net";
import { parse } from "./utils/parse";
import handler from "./handler";

const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on("data", (data) => {
    const [input] = parse(data);

    switch ((input[0] as string).toUpperCase()) {
      case "PING":
        connection.write(handler.PING());
        break;
      case "ECHO":
        connection.write(handler.ECHO(input[1] as string));
        break;
      case "SET":
        connection.write(
          handler.SET(...(input.slice(1) as Array<string | undefined>))
        );
        break;
      case "GET":
        connection.write(handler.GET(input[1] as string | undefined));
        break;
      default:
        connection.write(handler.ERROR(input));
    }
  });
});

server.listen(6379, "127.0.0.1");
