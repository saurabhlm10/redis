import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  console.log(
    `[server] connected client: ${JSON.stringify(connection.address())}`
  );

  connection.on("data", () => {
    connection.write("+PONG\r\n");
  });

  connection.end("end", () => {
    console.log("client disconencted");
  });
});

server.listen(6379, "127.0.0.1");
