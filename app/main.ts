import * as net from "net";
import { parseRESP } from "./utils/parseRESP";
import { ServerConfig } from "./types";
import { serverParams } from "./utils/parseServerArguments";
import { simpleString } from "./utils/simpleString";
import { bulkString } from "./utils/bulkString";

const serverConfig: ServerConfig = {
  role: serverParams?.role || "master",
  port: Number(serverParams?.port) || 6379,
};
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

    if (command.toLowerCase() === "ping") {
      // connection.write("+PONG\r\n");
      connection.write(simpleString("PONG"));
    } else if (command.toLowerCase() === "echo") {
      if (args.length > 0) {
        const response = bulkString(args[0] as string);
        connection.write(response);
      } else {
        connection.write("-Error: Missing argument for ECHO\r\n");
      }
    } else if (command.toLowerCase() === "set") {
      values.set(args[0], args[1]);
      connection.write(simpleString("OK"));
      if (args[2]?.toLowerCase() === "px") {
        setTimeout(() => {
          values.delete(args[0]);
        }, Number(args[3]));
      }
    } else if (command.toLowerCase() === "get") {
      const value = values.get(args[0]);
      connection.write(bulkString(value));
    } else if (command.toLowerCase() === "info") {
      let role = "master";
      const master = serverParams["replicaof"];
      if (master) role = "slave";
      const response = bulkString(`role:${role}`);
      connection.write(response);
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

console.log(serverParams);

server.listen(serverConfig.port, "127.0.0.1");
