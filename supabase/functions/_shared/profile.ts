// Shared ProfileRow type used by ask-pulse and the playbook matcher.
// Mirrors the columns added in 20260426020000_profiles_chat_context.sql.

export interface ProfileRow {
  current_visa_status: string | null;
  lottery_status: string | null;
  degree_level: string | null;
  field_of_study: string | null;
  employer_type: string | null;
  country_of_birth: string | null;
}
