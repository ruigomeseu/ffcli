import { gql } from "graphql-request";

export const USER_QUERY = gql`
  query {
    user {
      user_id
      name
      email
      num_transcripts
      minutes_consumed
      is_admin
    }
  }
`;

const TRANSCRIPT_BASE_FIELDS = `
  id
  title
  dateString
  duration
  organizer_email
  participants
  speakers {
    name
  }
`;

const SUMMARY_FIELDS = `
  summary {
    overview
    action_items
    topics_discussed
    keywords
    meeting_type
    outline
  }
`;

export const TRANSCRIPTS_QUERY = gql`
  query Transcripts($limit: Int, $skip: Int, $fromDate: DateTime, $toDate: DateTime, $mine: Boolean, $participant_email: String) {
    transcripts(limit: $limit, skip: $skip, fromDate: $fromDate, toDate: $toDate, mine: $mine, participant_email: $participant_email) {
      ${TRANSCRIPT_BASE_FIELDS}
    }
  }
`;

export const TRANSCRIPTS_WITH_SUMMARIES_QUERY = gql`
  query Transcripts($limit: Int, $skip: Int, $fromDate: DateTime, $toDate: DateTime, $mine: Boolean, $participant_email: String) {
    transcripts(limit: $limit, skip: $skip, fromDate: $fromDate, toDate: $toDate, mine: $mine, participant_email: $participant_email) {
      ${TRANSCRIPT_BASE_FIELDS}
      ${SUMMARY_FIELDS}
    }
  }
`;

export const TRANSCRIPT_DETAIL_QUERY = gql`
  query Transcript($id: String!) {
    transcript(id: $id) {
      ${TRANSCRIPT_BASE_FIELDS}
      ${SUMMARY_FIELDS}
      sentences {
        speaker_name
        start_time
        end_time
        text
      }
    }
  }
`;
