import { GoogleGenAI, Type } from "@google/genai";
import { ContextInfo } from '../types';

const BATCH_SIZE = 20; // Reduced batch size slightly for Pro model to ensure output stability

export const fixSubtitlesWithGemini = async (
  lines: string[], 
  context: ContextInfo,
  onProgress: (processed: number) => void,
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
      REFERENCE MATERIAL FROM URL (${context.referenceUrl}):
      """
      ${truncatedContent}
      """
      (Use the vocabulary, names, and context from the text above to correct specific terms in the subtitles.)
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
      You are an expert professional subtitle editor and proofreader. 
      Your task is to correct typos, misheard words, and proper noun errors in the provided subtitle lines.
      
      CONTEXT INFORMATION:
      - Speaker: ${context.speakerName || 'Unknown'}
      - Topic: ${context.topic || 'General Interview'}
      - Key Terms/Glossary (Pay close attention to these): ${context.keywords || 'None'}
      - Additional Background: ${context.extraContext || 'None'}
      ${referenceContext}

      INSTRUCTIONS:
      1. Analyze the input lines based on the context above.
      2. Fix homophone errors (e.g., "right" vs "write") and proper nouns (e.g., "Algonquin" vs "亚岗昆").
      3. Improve punctuation and fix sentence fragmentation (断句错误) for better readability.
${cleaningInstructions}
      4. Maintain the original tone and casual speech patterns unless they conflict with the cleaning instructions above.
      5. Do NOT merge lines. Do NOT split lines. The output array length MUST match the input array length exactly. If a line becomes empty after cleaning, return an empty string.
      6. Return ONLY a JSON array of strings containing the corrected text for each line.
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

    onProgress(Math.min(i + BATCH_SIZE, total));
  }

  return correctedLines;
};