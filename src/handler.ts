import type { RESPDataType } from "./utils/parse";
import {
  serializeSimpleError,
  serializeBulkString,
  serializeSimpleString,
} from "./utils/serialize";

class Handler {
  private storage = new Map();

  PING() {
    return serializeSimpleString("PONG");
  }
  ECHO(arg: string) {
    return serializeBulkString(arg);
  }
  ERROR(input: RESPDataType) {
    return serializeSimpleError(`Unknown command: ${input[0]}`);
  }
  SET(...args: Array<string | undefined>) {
    console.log(args);
    const key = args[0];
    const value = args[1];
    if (!key) {
      return serializeSimpleError("SYNTAX ERR expecting key");
    }
    if (!value) {
      return serializeSimpleError("SYNTAX ERR expecting value after key");
    }

    if (args[2] && args[2].toUpperCase() === "PX") {
      if (!args[3]) {
        return serializeSimpleString(
          "SYNTAX ERR expecting expiry time after PX"
        );
      }
      this.storage.set(key, { value, expiry: Date.now() + Number(args[3]) });
    } else {
      this.storage.set(key, { value, expiry: null });
    }
    return serializeSimpleString("OK");
  }
  GET(key: string | undefined) {
    console.log(this.storage);
    if (!key || !this.storage.has(key)) {
      return serializeBulkString("");
    }

    const { value, expiry } = this.storage.get(key);

    if (expiry && expiry - Date.now() <= 0) {
      this.storage.delete(key);
      return serializeBulkString("");
    }

    return serializeBulkString(value);
  }
}

export default new Handler();
