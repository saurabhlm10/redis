import { parseArgs } from "util";
import type { RESPDataType } from "./utils/parse";
import {
  serializeSimpleError,
  serializeBulkString,
  serializeSimpleString,
  serializeArray,
} from "./utils/serialize";

const { values } = parseArgs({
  args: process.argv,
  options: {
    dir: {
      type: "string",
    },
    dbfilename: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

console.log(values);

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

  CONFIG_GET(arg: string | undefined) {
    if (!arg) return serializeSimpleError("No parameters provided");

    switch (arg.toLowerCase()) {
      case "dir":
        return serializeArray(
          serializeBulkString("dir"),
          serializeBulkString(values.dir || "")
        );
      case "dbfilename":
        return serializeArray(
          serializeBulkString("dbfilename"),
          serializeBulkString(values.dbfilename || "")
        );
      default:
        return serializeSimpleError(`Invalid parameter: '${arg}'`);
    }
  }
}

export default new Handler();
