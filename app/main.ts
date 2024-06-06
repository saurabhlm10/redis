import * as net from "net";
import { parseRESP } from "./utils/parseRESP";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const server: net.Server = net.createServer((connection: net.Socket) => {
  const values = new Map();

  // Handle connection
  console.log(
    `[server] connected client: ${JSON.stringify(connection.address())}`
  );

  // Continuously handle data received from the client
  connection.on("data", (data) => {
    console.log(`Received data: ${data.toString()}`);

    // Parse the command
    const parsedData = parseRESP(data);
    const { command, args } = parsedData;

    console.log("cmmands", command);
    console.log("args", args);

    if (command === "ping") {
      connection.write("+PONG\r\n");
    } else if (command === "echo") {
      if (args.length > 0) {
        // Respond with a bulk string
        const response = `$${args[0]?.length}\r\n${args[0]}\r\n`;
        connection.write(response);
      } else {
        connection.write("-Error: Missing argument for ECHO\r\n");
      }
    } else if (command.toLowerCase() === "set") {
      values.set(args[0], args[1]);
      connection.write("+OK\r\n");
    } else if (command.toLowerCase() === "get") {
      const value = values.get(args[0]);
      connection.write(`$${value ? value.length + "\r\n" + value : "-1"}\r\n`);
    } else {
      connection.write("-Error\r\n");
    }
  });

  // Close the connection once done
  connection.on("end", () => {
    console.log("Client disconnected");
  });

  // Handle any errors on the connection
  connection.on("error", (err) => {
    console.error("Connection error: ", err);
  });
});

server.listen(6379, "127.0.0.1");
