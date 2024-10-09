import { configDotenv } from "dotenv";
configDotenv();
export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
export const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
export const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
export const AZURE_OPENAI_DEPLOYMENT_NAME =
  process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
export const AZURE_OPENAI_DEPLOYMENT_NAME_MINI =
  process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MINI;
export const AZURE_OPENAI_INSTANCE_NAME =
  process.env.AZURE_OPENAI_INSTANCE_NAME;
export const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;
