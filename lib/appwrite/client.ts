import { Account, Client, Databases } from "appwrite";

import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "@/lib/appwrite/config";

export function isAppwriteConfigured(): boolean {
  return Boolean(APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID);
}

let client: Client | undefined;
let account: Account | undefined;
let databases: Databases | undefined;

export function getAppwriteClient(): Client {
  if (client) return client;
  if (!isAppwriteConfigured()) {
    throw new Error(
      "Appwrite yapılandırılmadı. NEXT_PUBLIC_APPWRITE_ENDPOINT ve NEXT_PUBLIC_APPWRITE_PROJECT_ID tanımlayın."
    );
  }
  client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
  return client;
}

export function getAppwriteAccount(): Account {
  account ??= new Account(getAppwriteClient());
  return account;
}

export function getAppwriteDatabases(): Databases {
  databases ??= new Databases(getAppwriteClient());
  return databases;
}
