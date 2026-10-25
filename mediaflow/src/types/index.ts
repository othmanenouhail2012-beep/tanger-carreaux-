export type TaskStatus = 'queued' | 'analyzing' | 'processing' | 'ready' | 'failed' | 'cancelled' | 'expired';
export interface Option { format: string; kind: 'video' | 'audio'; height: number | null; original?: boolean; enabled: boolean; reason: string | null }
export interface SubtitleTrack { index: number; language: string; title: string | null; codec: string; textBased: boolean }
export interface MediaInfo {
  source: 'upload' | 'direct'; platform: string; title: string; mediaType: string;
  uploadId?: string; url?: string; mime?: string;
  duration: number | null; size: number | null; thumbnail?: string | null;
  width?: number | null; height?: number | null; container?: string | null;
  videoCodec?: string | null; audioCodec?: string | null; subtitles?: SubtitleTrack[];
  options: Option[];
}
export interface Task {
  id: string; name: string; type: 'convert' | 'extract_audio'; status: TaskStatus; progress: number;
  size: number | null; outputName: string; error: string | null; createdAt: number;
  finishedAt?: number; expiresAt?: number; format: string; height: number | null;
}
export interface Capabilities {
  connectors: { id: string; name: string; configured: boolean; capabilities: string[] }[];
  formats: string[]; transcription: boolean;
  limits: { uploadMb: number; remoteMb: number; durationMin: number; ttlMinutes: number };
}
