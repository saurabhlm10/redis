import * as net from "net";
import * as path from "path";
import * as fs from "fs/promises";
import { parse } from "./utils/parse";
import { serializeSimpleError } from "./utils/serialize";
import { Handler } from "./handler";
import { RDBReader } from "./rdbReader";
import { parseArgs } from "node:util";

// Replace Bun.argv with process.argv.slice(2)
const { values } = parseArgs({
  args: process.argv.slice(2),
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

export interface IMapValueType {
  value: string;
  expire: bigint | null;
}

export interface IMapType {
  key: string;
  value: IMapValueType;
}

export let db: Map<string, { value: string; expire: bigint | null }> =
  new Map();

// Initialize database
(async () => {
  const result = await readRDBFile(values, values.dbfilename);
  if (result) {
    db = new Map(Object.entries(result.db.values));
  }

  const handler = new Handler(values);
  const server: net.Server = net.createServer((connection: net.Socket) => {
    connection.on("data", (data) => {
      const [input] = parse(data);

      switch ((input[0] as string).toUpperCase()) {
        case "PING":
          connection.write(handler.PING());
          break;
        case "ECHO":
          connection.write(handler.ECHO(input[1] as string));
          break;
        case "SET":
          connection.write(
            handler.SET(...(input.slice(1) as Array<string | undefined>))
          );
          break;
        case "GET":
          connection.write(handler.GET(input[1] as string | undefined));
          break;
        case "CONFIG":
          switch ((input[1] as string).toUpperCase()) {
            case "GET":
              connection.write(
                handler.CONFIG_GET(input[2] as string | undefined)
              );
              break;
            default:
              connection.write(
                serializeSimpleError(`Unknown CONFIG command: ${input[1]}`)
              );
          }
          break;
        case "KEYS":
          connection.write(handler.KEYS(input[1] as string | undefined));
          break;
        default:
          connection.write(handler.ERROR(input));
      }
    });
  });

  server.listen(6379, "127.0.0.1");
})();

async function readRDBFile(
  values: { dir?: string | undefined; dbfilename?: string | undefined },
  filepath: string | undefined
) {
  if (!filepath) return null;

  const fullPath = path.join(values.dir || "", filepath);

  try {
    const exists = await fs
      .access(fullPath)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      return null;
    }

    // Replace Bun.file with Node.js file operations
    const reader = await RDBReader.loadFile(fullPath);
    const result = reader.readFile();

    return result;
  } catch (error) {
    console.error("Error reading RDB file:", error);
    return null;
  }
}
