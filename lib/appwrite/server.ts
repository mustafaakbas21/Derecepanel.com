import "server-only";

import { Account, Client, Databases, ID, Query, Storage, Users } from "node-appwrite";

import {
  APPWRITE_DATABASE_ID,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
} from "@/lib/appwrite/config";

function readApiKey(): string {
  return process.env.APPWRITE_API_KEY?.trim() ?? "";
}

export function isAppwriteServerConfigured(): boolean {
  return Boolean(APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID && readApiKey());
}

export function getAppwriteAdminClient(): Client {
  const apiKey = readApiKey();
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !apiKey) {
    throw new Error(
      "Appwrite sunucu yapılandırması eksik. APPWRITE_API_KEY ve NEXT_PUBLIC_APPWRITE_* tanımlayın."
    );
  }
  return new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(apiKey);
}

export function getAppwriteSessionClient(sessionSecret: string): Client {
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
    throw new Error("Appwrite endpoint/project eksik.");
  }
  return new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setSession(sessionSecret);
}

export function getAdminDatabases(): Databases {
  return new Databases(getAppwriteAdminClient());
}

export function getAdminStorage(): Storage {
  return new Storage(getAppwriteAdminClient());
}

export function getAdminUsers(): Users {
  return new Users(getAppwriteAdminClient());
}

export function getSessionAccount(sessionSecret: string): Account {
  return new Account(getAppwriteSessionClient(sessionSecret));
}

export function getSessionDatabases(sessionSecret: string): Databases {
  return new Databases(getAppwriteSessionClient(sessionSecret));
}

export { APPWRITE_DATABASE_ID, ID, Query };
