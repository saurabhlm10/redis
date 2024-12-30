import type { RESPDataType } from "./utils/parse";
import {
  serializeSimpleError,
  serializeBulkString,
  serializeSimpleString,
  serializeArray,
} from "./utils/serialize";
import { db, type IMapValueType } from "./index";

interface IValuesType {
  dir?: string | undefined;
  dbfilename?: string | undefined;
}

export class Handler {
  private storage: Map<string, IMapValueType>;
  private values: IValuesType;

  constructor(values: IValuesType) {
    this.storage = db;
    this.values = values;
  }

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
      this.storage.set(key, {
        value,
        expire: BigInt(Date.now() + Number(args[3])),
      });
    } else {
      this.storage.set(key, { value, expire: null });
    }
    return serializeSimpleString("OK");
  }
  GET(key: string | undefined) {
    if (!key || !this.storage.has(key)) {
      return serializeBulkString("");
    }

    const { value, expire } = this.storage.get(key) as IMapValueType;

    if (expire && expire - BigInt(Date.now()) <= 0) {
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
          serializeBulkString(this.values.dir || "")
        );
      case "dbfilename":
        return serializeArray(
          serializeBulkString("dbfilename"),
          serializeBulkString(this.values.dbfilename || "")
        );
      default:
        return serializeSimpleError(`Invalid parameter: '${arg}'`);
    }
  }

  KEYS(arg: string | undefined) {
    if (!arg)
      return serializeSimpleError(
        "ERR wrong number of arguments for 'KEYS' command"
      );

    if (arg === "*") {
      const keys = Array.from(this.storage.keys()).map((key) =>
        serializeBulkString(key)
      );

      return serializeArray(...keys);
    }
    return serializeBulkString("");
  }
}
