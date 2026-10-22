export type EventRow = {
  id: string; title: string; prefecture: string; date_start: string; date_end: string | null;
  venue: string | null; category: string | null; organizer: string | null; url: string | null;
  description: string | null; poster_name: string; is_verified: boolean; created_at: string;
};
export type TeamRow = {
  id: string; team_name: string; prefecture: string; city: string | null; category: string | null;
  recruiting: boolean; website_url: string | null; sns_url: string | null; description: string | null;
  poster_name: string; is_verified: boolean; created_at: string;
};
export type ThreadRow = {
  id: string; title: string; category: string; prefecture: string | null; body: string;
  poster_name: string; reply_count: number; last_activity_at: string; created_at: string;
};
export type ReplyRow = { id: string; thread_id: string; body: string; poster_name: string; created_at: string };
export type ColumnRow = {
  id: string; title: string; author: string; body: string; is_published: boolean;
  is_submission: boolean; published_at: string | null; created_at: string;
};

export const EVENT_COLS = "id,title,prefecture,date_start,date_end,venue,category,organizer,url,description,poster_name,is_verified,created_at";
export const TEAM_COLS = "id,team_name,prefecture,city,category,recruiting,website_url,sns_url,description,poster_name,is_verified,created_at";
export const THREAD_COLS = "id,title,category,prefecture,body,poster_name,reply_count,last_activity_at,created_at";
