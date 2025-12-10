export interface SubtitleCue {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  originalText?: string; // Used for diffing
  isConfirmed?: boolean; // Used for review status
}

export interface ContextInfo {
  speakerName: string;
  topic: string;
  keywords: string; // Specific terms like "Algonquin College"
  extraContext: string;
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