import { MongoClient } from "./deps.ts";

const dbName = Deno.env.get("DB_NAME") || "";
const dbHostUrl = Deno.env.get("DB_HOST_URL") || "";
console.log(dbHostUrl);

const client = new MongoClient();
await client.connect(dbHostUrl);

const db = client.database(dbName);
export default db;
