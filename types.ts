export interface SubtitleCue {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  originalText?: string; // Used for diffing
  isConfirmed?: boolean; // Used for review status
}

export interface ContextInfo {
  projectContext: string; // Mapping to "Content Description"
  glossaryTerms: string; // Mapping to "Key Names & Terms"
  // Reference Website
  referenceUrl: string;
  referenceUrlContent: string;
  // Cleaning Options
  removeFillers: boolean;
  fixStutters: boolean;
  filterProfanity: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ProcessingStats {
  totalLines: number;
  processedLines: number;
  correctedCount: number;
}