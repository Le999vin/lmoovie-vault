import { ChatOpenAI } from "@langchain/openai";

const DEFAULT_MODEL = "mistralai/devstral-2512:free";
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

export function getChatModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing env: OPENROUTER_API_KEY");
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const baseURL = process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL;

  return new ChatOpenAI({
    apiKey,
    model,
    configuration: {
      baseURL,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Movie Vault",
      },
    },
    temperature: 0.35,
  });
}
