export type ReportStatus = "selected" | "not_selected";
export type WageLevel = "1" | "2" | "3" | "4";
export type EducationLevel = "Masters" | "Bachelors" | "Other";

export interface Report {
  id: string;
  classification: ReportStatus;
  wage_level: WageLevel;
  education_level: EducationLevel;
  created_utc: string;
  employer_mentions: string[];
  cap_type: string | null;
  title: string;
  body: string;
  score: number;
  author: string;
  permalink: string;
  source_type: string;
  source_id: string;
}

export function getReportsByTimeWindow(reports: Report[], hours: number) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return reports.filter(r => new Date(r.created_utc).getTime() > cutoff);
}

export function countByStatus(reports: Report[]) {
  return {
    selected: reports.filter(r => r.classification === "selected").length,
    not_selected: reports.filter(r => r.classification === "not_selected").length,
  };
}
