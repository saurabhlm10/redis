import { serverParams } from "./parseServerArguments";

export function initMaster() {
  const master = serverParams["replicaof"] || "";
  const [url, port] = master.split(/\s|_/);
  if (url && Number(port)) {
    return false;
  }
  serverParams.master_replid = "8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb";
  serverParams.master_repl_offset = "0";
  return true;
}
