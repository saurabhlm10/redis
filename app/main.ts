import * as net from "net";
import { parseRESP } from "./utils/parseRESP";
import { ServerConfig } from "./types";
import { serverParams } from "./utils/parseServerArguments";
import { simpleString } from "./utils/simpleString";
import { bulkString } from "./utils/bulkString";
import { initMaster } from "./utils/initMaster";
import { arrToRESP } from "./utils/arrToRESP";
import { handleHandshake } from "./utils/handleHandShake";
import { createEmptyRDBContent } from "./utils/createEmptyRDBContent";
import { isWriteCommand } from "./utils/isWriteCommand";
import { processCommand } from "./utils/processCommand";

const serverConfig: ServerConfig = {
  role: serverParams?.role || "master",
  port: Number(serverParams?.port) || 6379,
};
const HOST = "127.0.0.1";
const isMaster = initMaster();

if (!isMaster) {
  const handshakeData = { clientPort: serverConfig.port, currentStep: 0 };
  let handshakeComplete = false;

  const client = net.createConnection(
    { host: serverParams.masterUrl, port: +serverParams.masterPort },
    () => {
      console.log("Connected to the master server");
      client.write(arrToRESP(["ping"]));
    }
  );
  client.on("data", (data) => {
    console.log("Received from the master server:", data.toString());

    const receivedData = data.toString();
    console.log("Received from the master server:", receivedData);
    if (receivedData == simpleString("PONG") && handshakeData.currentStep === 0)
      handshakeData.currentStep = 1;
    else if (
      receivedData == simpleString("OK") &&
      handshakeData.currentStep === 1
    ) {
      handshakeData.currentStep = 2;
    } else if (
      receivedData == simpleString("OK") &&
      handshakeData.currentStep == 2
    )
      handshakeData.currentStep = 3;
    else if (
      receivedData.startsWith("+FULLRESYNC") &&
      handshakeData.currentStep === 3
    ) {
      handshakeComplete = true;
      console.log("Handshake complete, received FULLRESYNC");
      return;
    }

    console.log(handshakeData.currentStep);

    console.log("handshake", handshakeComplete);

    if (!handshakeComplete) {
      handleHandshake(client, handshakeData);
    }

    if (handshakeComplete && receivedData.startsWith("+FULLRESYNC")) {
      // Handle FULLRESYNC response
      console.log("Received FULLRESYNC, waiting for RDB file...");
    }
  });
  client.on("end", () => {
    console.log("Disconnected from the master server");
  });
  client.on("error", (err) => {
    console.error("Client error:", err);
  });
}

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const replicaConnections: Set<net.Socket> = new Set();

// Uncomment this block to pass the first stage
const server: net.Server = net.createServer((connection: net.Socket) => {
  let isReplica = false;
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
    } else if (isWriteCommand(command)) {
      console.log(replicaConnections);
      // Process the command
      processCommand(command, args, values);

      // Propagate the command to replicas
      const respCommand = arrToRESP([command, ...args]);
      for (const replica of replicaConnections) {
        replica.write(respCommand);
      }

      console.log(values);

      // Send response to the client
      connection.write(simpleString("OK"));
    } else if (command.toLowerCase() === "get") {
      const value = values.get(args[0]);
      connection.write(bulkString(value));
    } else if (command.toLowerCase() === "info") {
      let role = "master";
      const { master_replid, master_repl_offset } = serverParams;
      if (!master_replid) role = "slave";
      const response = bulkString(
        `role:${role}\r\nmaster_replid:${master_replid}\r\nmaster_repl_offset:${master_repl_offset}\r\n`
      );
      connection.write(response);
    } else if (command.toLowerCase() === "replconf") {
      isReplica = true;
      const response = simpleString("OK");
      connection.write(response);
    } else if (command.toLowerCase() === "psync") {
      isReplica = true;
      replicaConnections.add(connection);
      const { master_replid, master_repl_offset } = serverParams;
      const response = simpleString(
        `FULLRESYNC ${master_replid} ${master_repl_offset}`
      );
      connection.write(response);
      const emptyRDB = createEmptyRDBContent();
      const rdbLength = emptyRDB.length;
      connection.write(`$${rdbLength}\r\n`);
      connection.write(emptyRDB);
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
    if (isReplica) {
      replicaConnections.delete(connection);
    }
    console.error("Connection error: ", err);
  });
});

server.listen(serverConfig.port, HOST);
