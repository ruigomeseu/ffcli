export interface FirefliesUser {
  user_id: string;
  name: string;
  email: string;
  num_transcripts: number;
  minutes_consumed: number;
  is_admin: boolean;
}

export interface TranscriptSummary {
  overview?: string;
  action_items?: string;
  topics_discussed?: string;
  keywords?: string[];
  meeting_type?: string;
  outline?: string;
}

export interface Sentence {
  speaker_name: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface TranscriptListItem {
  id: string;
  title: string;
  dateString: string;
  duration: number;
  organizer_email: string;
  participants: string[];
  speakers: { name: string }[];
  summary?: TranscriptSummary;
}

export interface TranscriptDetail {
  id: string;
  title: string;
  dateString: string;
  duration: number;
  organizer_email: string;
  participants: string[];
  speakers: { name: string }[];
  summary: TranscriptSummary;
  sentences: Sentence[];
}

export interface ListTranscriptsOptions {
  limit?: number;
  skip?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
  participant?: string;
  includeSummaries?: boolean;
}

export interface AppConfig {
  apiKey: string;
}

export interface FirefliesError {
  code: string;
  message: string;
}
