import type { RESPDataType } from "./utils/parse";
import {
  serializeSimpleError,
  serializeBulkString,
  serializeSimpleString,
} from "./utils/serialize";

class Handler {
  PING() {
    return serializeSimpleString("PONG");
  }
  ECHO(arg: string) {
    return serializeBulkString(arg);
  }
  ERROR(input: RESPDataType) {
    return serializeSimpleError(`Unknown command: ${input[0]}`);
  }
}

export default new Handler();
