import { SubtitleCue } from '../types';

/**
 * Parses raw SRT file content into an array of SubtitleCue objects.
 */
export const parseSRT = (content: string): SubtitleCue[] => {
  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by double newlines which typically separate cues
  const blocks = normalizedContent.split('\n\n');
  
  const cues: SubtitleCue[] = [];

  blocks.forEach((block) => {
    const lines = block.trim().split('\n');
    if (lines.length < 3) return; // Not a valid block

    // 1. ID
    const id = parseInt(lines[0], 10);
    if (isNaN(id)) return;

    // 2. Timecode line (e.g., 00:00:01,000 --> 00:00:04,000)
    const timecodeLine = lines[1];
    const timeMatch = timecodeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s-->\s(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    
    if (!timeMatch) return;

    // 3. Text (can be multiple lines, join with newline)
    const text = lines.slice(2).join('\n');

    cues.push({
      id,
      startTime: timeMatch[1],
      endTime: timeMatch[2],
      text,
      originalText: text
    });
  });

  return cues;
};

/**
 * Converts an array of SubtitleCue objects back into a formatted SRT string.
 */
export const buildSRT = (cues: SubtitleCue[]): string => {
  return cues.map(cue => {
    return `${cue.id}\n${cue.startTime} --> ${cue.endTime}\n${cue.text}`;
  }).join('\n\n');
};

/**
 * Simple diff checker to see if text changed significantly
 */
export const hasChanged = (original: string, current: string): boolean => {
  return original.trim() !== current.trim();
};
