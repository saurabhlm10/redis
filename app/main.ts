import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  console.log(
    `[server] connected client: ${JSON.stringify(connection.address())}`
  );

  // Continuously handle data received from the client
  connection.on("data", (data) => {
    console.log(`Received data: ${data.toString()}`);
    // Respond to each chunk of data received
    data
      .toString()
      .trim()
      .split("\n")
      .forEach((command) => {
        if (command.toLowerCase() === "ping") {
          connection.write("+PONG\r\n");
        }
      });
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
