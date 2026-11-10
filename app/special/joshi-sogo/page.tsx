import type { Metadata } from "next";
import { db, safeList } from "@/lib/supabase";
import { EVENT_COLS, type EventRow } from "@/lib/types";
import { todayJST } from "@/lib/format";
import { JOSHI_SOGO as J } from "@/lib/specials";
import JoshiView from "@/components/JoshiSogoView";
import { getSetting } from "@/lib/settings";
import { D1G_ROWS, S1G_ROWS, mergeRows, parseOverrides } from "@/lib/joshi-reps";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: `${J.edition}${J.name} 特設ページ`,
  description: `${J.dateLabel}・${J.venue}で開催される${J.edition}${J.name}の大会情報と、全国の予選会をまとめた特設ページです。`,
};

export default async function JoshiSogoPage() {
  const today = todayJST();
  const [ov, events] = await Promise.all([getSetting("joshi_reps").then(parseOverrides), safeList<EventRow>(() =>
    db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).ilike("category", "%ガールズ%").gte("date_start", J.qualFrom).lt("date_start", J.date).order("date_start").limit(300)
  )]);
  return <JoshiView events={events} today={today} d1g={mergeRows(D1G_ROWS, ov)} s1g={mergeRows(S1G_ROWS, ov)} />;
}

