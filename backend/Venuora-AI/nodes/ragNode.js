/**
 * RAG NODE (LangGraph + LangChain)
 * ──────────────────────────────────────────────────────────────
 * Retrieval-Augmented Generation node.
 *
 * Architecture:
 * 1. Takes user question from state.
 * 2. Uses LangChain's QdrantVectorStore.asRetriever() to search the
 *    most relevant document chunks from Qdrant vector database.
 * 3. Builds a grounded prompt using ChatPromptTemplate.
 * 4. Generates an accurate, grounded answer using OpenRouter LLM.
 * 5. Returns { answer, ragOutput } to update the LangGraph state.
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

// Load backend root .env
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenRouter } from "../lib/ChatOpenRouter.js";

// ── 1. Vector Store & Embeddings Configuration ──────────────────────────────
const COLLECTION_NAME = "venuora_knowledge";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

const embeddings = new OpenAIEmbeddings({
  model: EMBEDDING_MODEL,
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

let cachedVectorStore = null;

async function getVectorStore() {
  if (!cachedVectorStore) {
    cachedVectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: COLLECTION_NAME,
      contentPayloadKey: "text",
      checkCompatibility: false,
    });
  }
  return cachedVectorStore;
}

// ── 2. LLM & Prompt Template ─────────────────────────────────────────────────
const llm = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "nvidia/nemotron-3-super-120b-a12b:free",
  temperature: 0.2,
});

const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are the official Venuora AI Assistant, helping customers with venue and marriage hall bookings.
Answer the user's question accurately and politely based ONLY on the provided context below.
If the context does not contain enough information to answer the question, clearly state that you don't have that specific information in your records and suggest contacting support or browsing the venues directly.
Do not invent or hallucinate facts that are not present in the context.

Context:
{context}`,
  ],
  ["human", "{question}"],
]);

// LangChain LCEL chain: prompt -> LLM -> string output parser
const ragChain = ragPrompt.pipe(llm).pipe(new StringOutputParser());

// ── 3. LangGraph Node Function ───────────────────────────────────────────────
/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Promise<Partial<import('../graph/state.js').VenuoraState>>}
 */
export async function ragNode(state) {
  const question = state.question || state.userQuery || "";
  console.log("\n📚 [RAG] Searching relevant chunks for question:", question);

  try {
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever({ k: 4 });

    // 1. Retrieve top matching chunks using LangChain Retriever abstraction
    const relevantDocs = await retriever.invoke(question);
    console.log(`📚 [RAG] Found ${relevantDocs.length} relevant chunks from Qdrant`);

    const context = relevantDocs
      .map((doc, idx) => `[Document Chunk ${idx + 1}]:\n${doc.pageContent}`)
      .join("\n\n---\n\n");

    // 2. Generate grounded answer using LLM
    const answer = await ragChain.invoke({
      context: context || "No relevant document chunks found.",
      question,
    });

    console.log("📚 [RAG] Answer generated successfully.");

    return {
      answer,
      ragOutput: answer,
    };
  } catch (error) {
    console.error("❌ [RAG Error]:", error.message);
    const fallback =
      "I encountered an error retrieving company knowledge. Please try again or reach out to our support team.";
    return {
      answer: fallback,
      ragOutput: fallback,
    };
  }
}
