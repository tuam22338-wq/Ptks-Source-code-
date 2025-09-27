import type Dexie from 'dexie';
import type { RagSource, RagEmbedding } from '../types';
import * as db from './dbService';
import { generateWithRetry } from './gemini/gemini.core';

// A simple text chunking function
const chunkText = (text: string, chunkSize = 512, overlap = 50): string[] => {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        const end = Math.min(i + chunkSize, text.length);
        chunks.push(text.slice(i, end));
        i += chunkSize - overlap;
    }
    return chunks;
};
async function embedText(text: string[]): Promise<number[][]> {
    // This is a placeholder. In a real environment with a backend,
    // you would make a call to the embeddings API.
    // For this frontend-only app, we'll simulate embeddings with random vectors.
    console.warn("SIMULATING EMBEDDINGS: Using random vectors. RAG search will not be semantically accurate.");
    return text.map(() => Array.from({ length: 768 }, () => Math.random() * 2 - 1));
}
// Placeholder for vector similarity search. In a real-world scenario, you might use
// a library like 'vectra' or perform cosine similarity calculations if the dataset is small.
async function findSimilarEmbeddings(queryVector: number[], sourceIds: string[], topK: number): Promise<RagEmbedding[]> {
    console.warn("SIMULATING VECTOR SEARCH: Returning random chunks. RAG search will not be semantically accurate.");
    const potentialEmbeddings = await db.db.ragEmbeddings
        .where('sourceId').anyOf(sourceIds)
        .limit(100) // Get a random sample to simulate
        .toArray();
    
    // Return a random subset as a placeholder for actual similarity search
    return potentialEmbeddings.sort(() => 0.5 - Math.random()).slice(0, topK);
}
export const getAllSources = async (): Promise<RagSource[]> => {
    return await db.db.ragSources.toArray();
};
export const addPlayerJournalSource = async (file: File): Promise<void> => {
    const content = await file.text();
    const source: RagSource = {
        id: `player_journal_${Date.now()}`,
        name: file.name,
        type: 'PLAYER_JOURNAL',
        status: 'UNINDEXED',
        lastIndexed: null,
        isEnabled: true,
        content: content,
    };
    await db.db.ragSources.put(source);
};
export const deleteSource = async (sourceId: string): Promise<void> => {
    // FIX: Access tables via the exported 'db' instance from the 'db' module namespace.
    await (db.db as Dexie).transaction('rw', db.db.ragSources, db.db.ragEmbeddings, async () => {
        await db.db.ragSources.delete(sourceId);
        await db.db.ragEmbeddings.where('sourceId').equals(sourceId).delete();
    });
};
export const indexSource = async (sourceId: string): Promise<void> => {
    const source = await db.db.ragSources.get(sourceId);
    if (!source || !source.content) {
        throw new Error(`Source '${sourceId}' not found or has no content to index.`);
    }
    await db.db.ragSources.update(sourceId, { status: 'INDEXING' });
    try {
        const settings = await db.getSettings();
        const chunkSize = settings?.ragChunkSize || 512;
        const chunkOverlap = settings?.ragChunkOverlap || 50;

        const chunks = chunkText(source.content, chunkSize, chunkOverlap);
        
        // This is where you would call the real Gemini embedding API in a backend environment.
        // For frontend simulation, we use a placeholder.
        const embeddings = await embedText(chunks);
        const embeddingObjects: Omit<RagEmbedding, 'id'>[] = chunks.map((chunk, i) => ({
            sourceId: sourceId,
            chunk: chunk,
            embedding: embeddings[i],
        }));
        // Clear old embeddings and add new ones
        // FIX: Access tables via the exported 'db' instance from the 'db' module namespace.
        await (db.db as Dexie).transaction('rw', db.db.ragEmbeddings, async () => {
            await db.db.ragEmbeddings.where('sourceId').equals(sourceId).delete();
            await db.db.ragEmbeddings.bulkAdd(embeddingObjects as RagEmbedding[]);
        });
        await db.db.ragSources.update(sourceId, {
            status: 'INDEXED',
            lastIndexed: new Date().toISOString(),
            content: '', // Clear content after indexing to save space
        });
    } catch (error) {
        await db.db.ragSources.update(sourceId, { status: 'ERROR' });
        throw error;
    }
};
export const queryRAG = async (queryText: string, sourceTypes: RagSource['type'][], topK: number): Promise<string> => {
    const enabledSources = await db.db.ragSources
        .where('type').anyOf(...sourceTypes)
        .and(source => source.isEnabled === true && source.status === 'INDEXED')
        .toArray();
    if (enabledSources.length === 0) {
        return "";
    }
    const sourceIds = enabledSources.map(s => s.id);
    try {
        // 1. Embed the query text
        const queryVector = (await embedText([queryText]))[0];
        // 2. Find similar embeddings in the database
        const results = await findSimilarEmbeddings(queryVector, sourceIds, topK);
        if (results.length === 0) {
            return "";
        }
        // 3. Format results into a context string
        const contextString = results
            .map((res, i) => `--- Tri thức liên quan ${i + 1} (Nguồn: ${res.sourceId}) ---\n${res.chunk}`)
            .join('\n\n');
        return contextString;
    } catch (error) {
        console.error("Error during RAG query:", error);
        return ""; // Return empty string on error to not break the game flow
    }
};