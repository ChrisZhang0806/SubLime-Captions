import { GoogleGenAI, Type } from "@google/genai";
import { ContextInfo } from '../types';

const BATCH_SIZE = 20; // Reduced batch size slightly for Pro model to ensure output stability

export const fixSubtitlesWithGemini = async (
  lines: string[], 
  context: ContextInfo,
  onProgress: (processed: number, currentLines: string[]) => void,
  signal?: AbortSignal,
  modelId: string = "gemini-3-pro-preview"
): Promise<string[]> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const correctedLines: string[] = [];
  const total = lines.length;

  // Build dynamic cleaning instructions
  let cleaningInstructions = "";
  if (context.removeFillers) {
    cleaningInstructions += `   - REMOVE filler words and hesitation markers (e.g., "um", "ah", "er", "hmm", "嗯", "啊", "那个" (when used as filler), "就是" (when used as filler)).\n`;
  }
  if (context.fixStutters) {
    cleaningInstructions += `   - FIX stuttering and unnecessary repetitions (e.g., "I... I went" -> "I went", "我...我去" -> "我去").\n`;
  }
  if (context.filterProfanity) {
    cleaningInstructions += `   - FILTER or remove profanity/swear words.\n`;
  }

  // Handle Reference URL Content
  let referenceContext = "";
  if (context.referenceUrlContent) {
    // Truncate to reasonable length to avoid massive prompts if the site is huge, approx 10k chars
    const truncatedContent = context.referenceUrlContent.slice(0, 10000);
    referenceContext = `
      Reference Material (${context.referenceUrl}):
      """
      ${truncatedContent}
      """
    `;
  }

  // Process in batches
  for (let i = 0; i < total; i += BATCH_SIZE) {
    // Check for cancellation before starting a new batch
    if (signal?.aborted) {
      throw new Error("Processing aborted by user");
    }

    const batch = lines.slice(i, i + BATCH_SIZE);
    
    // Construct Prompt
    const prompt = `
      You are a professional subtitle editor. Your task is to correct typos, homophone errors, and punctuation in the provided subtitles.
      
      Context Information
      Context & User Instructions: ${context.projectContext || "General video content"} (Follow any specific editing rules provided here)
      
      Critical Glossary: ${context.glossaryTerms || "None provided"} 
      (Use the glossary to ensure proper nouns and technical terms are spelled correctly. Use the scenario to infer context for ambiguous words.)
      ${referenceContext}

      Instructions
      1. Fix typos based on pinyin/sound-alike errors (common in ASR).
      2. If a word in the subtitles sounds similar to a word in the Critical Glossary, prioritize the spelling in the Glossary.
      3. Ensure sentence flow is logical based on the provided context.
      4. Do NOT summarize or change the meaning. Keep the original line count and timestamps.
${cleaningInstructions}
      5. Return ONLY a JSON array of strings containing the corrected text for each line.
    `;

    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { text: `INPUT SUBTITLES:\n${JSON.stringify(batch)}` }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from AI");
      }

      const batchResult = JSON.parse(responseText) as string[];

      if (batchResult.length !== batch.length) {
        console.warn(`Batch mismatch: Expected ${batch.length}, got ${batchResult.length}. Filling with originals.`);
        // Fallback: if length mismatch, keep original for this batch to avoid shifting
        // This is a safety mechanism
        correctedLines.push(...batch); 
      } else {
        correctedLines.push(...batchResult);
      }

    } catch (error) {
      // If the error was caused by our abort, rethrow it
      if (signal?.aborted) {
        throw new Error("Processing aborted by user");
      }
      
      console.error("Error processing batch:", error);
      // On error, keep original text for this batch so we don't break the file
      correctedLines.push(...batch);
    }

    // Emit progress with current state of lines
    onProgress(Math.min(i + BATCH_SIZE, total), [...correctedLines]);
  }

  return correctedLines;
};