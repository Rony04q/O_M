// src/lib/aiEmbeddings.ts

// NOTE: We don't need the Cohere or Google SDKs anymore!
// We can use a simple fetch request.

const OLLAMA_API_URL = "http://localhost:11434/api/embeddings";
const EMBEDDING_MODEL = "nomic-embed-text";

/**
 * Generates a vector embedding for a given text using local Ollama.
 * @param text The text to embed.
 * @returns A promise that resolves to the embedding vector (array of numbers).
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Ollama returns the embedding in a different structure
    return data.embedding || null;

  } catch (error: any) {
    console.error("Error generating Ollama embedding:", error.message);
    return null;
  }
}