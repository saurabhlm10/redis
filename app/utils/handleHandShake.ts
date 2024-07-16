import net from "net";
import { arrToRESP } from "./arrToRESP";
export function handleHandshake(
  client: net.Socket,
  handshakeData: {
    clientPort: number;
    currentStep: number;
  }
) {
  const { clientPort, currentStep } = handshakeData;

  if (currentStep === 1)
    return client.write(
      arrToRESP(["REPLCONF", "listening-port", `${clientPort}`])
    );
  if (currentStep === 2)
    return client.write(arrToRESP(["REPLCONF", "capa", "psync2"]));
  if (currentStep === 3) return client.write(arrToRESP(["PSYNC", "?", "-1"]));
}
