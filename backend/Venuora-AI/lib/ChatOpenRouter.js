/**
 * VENUORA-AI — ChatOpenRouter
 * ──────────────────────────────────────────────────────────────
 * Thin wrapper around ChatOpenAI that pre-configures the
 * OpenRouter base URL so we can use any OpenRouter model
 * (including free ones like nvidia/nemotron-*) as a drop-in.
 *
 * Usage:
 *   import { ChatOpenRouter } from "../lib/ChatOpenRouter.js";
 *
 *   const model = new ChatOpenRouter({
 *     apiKey: process.env.OPENROUTER_API_KEY,
 *     model: "nvidia/nemotron-3-super-120b-a12b:free",
 *     temperature: 0,
 *   });
 */

import { ChatOpenAI } from "@langchain/openai";

export class ChatOpenRouter extends ChatOpenAI {
  constructor({ apiKey, model, temperature = 0, ...rest } = {}) {
    super({
      apiKey: apiKey || rest.openAIApiKey,
      openAIApiKey: apiKey || rest.openAIApiKey,
      model: model || rest.modelName,
      modelName: model || rest.modelName,
      temperature,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://venuora.app",   // shown in OpenRouter dashboard
          "X-Title": "Venuora-AI",
        },
      },
      ...rest,
    });
  }
}
