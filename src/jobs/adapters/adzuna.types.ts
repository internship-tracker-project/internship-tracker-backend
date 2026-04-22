export interface AdzunaJob {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  description?: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
}

export interface AdzunaSearchResponse {
  count: number;
  results: AdzunaJob[];
}

export interface NormalizedJob {
  source: string;
  sourceId: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  applyUrl: string;
  salary: string | null;
  postedAt: Date;
}
