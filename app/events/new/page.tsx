import type { Metadata } from "next";
import { PageHead } from "@/components/Layout";
import ActionForm from "@/components/ActionForm";
import PrefSelect from "@/components/PrefSelect";
import { createEvent } from "@/app/actions";
import { EVENT_CATEGORIES } from "@/lib/prefectures";

export const metadata: Metadata = { title: "大会予定を投稿する" };

export default function NewEventPage() {
  return (
    <>
      <PageHead kicker="POST" title="大会予定を投稿する" lead="主催者・協会の発表済みの情報を投稿してください。投稿はすぐに一覧に公開されます。" />
      <div className="form-card">
        <ActionForm action={createEvent} submitLabel="この内容で投稿する" poster agree>
          <label className="field">
            <span>大会名<em>必須</em></span>
            <input name="title" required maxLength={80} placeholder="例）第10回 〇〇カップ ドッジボール大会" />
          </label>
          <div className="row-2">
            <label className="field">
              <span>開催都道府県<em>必須</em></span>
              <PrefSelect />
            </label>
            <label className="field">
              <span>カテゴリ</span>
              <select name="category" defaultValue="">
                <option value="">選んでください</option>
                {EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <div className="row-2">
            <label className="field">
              <span>開催日<em>必須</em></span>
              <input name="date_start" type="date" required />
            </label>
            <label className="field">
              <span>終了日（2日以上の大会のみ）</span>
              <input name="date_end" type="date" />
            </label>
          </div>
          <label className="field">
            <span>会場</span>
            <input name="venue" maxLength={80} placeholder="例）〇〇市総合体育館" />
          </label>
          <label className="field">
            <span>主催</span>
            <input name="organizer" maxLength={60} placeholder="例）〇〇県ドッジボール協会" />
          </label>
          <label className="field">
            <span>大会要項・詳細ページのURL</span>
            <input name="url" type="url" maxLength={500} placeholder="https://" />
            <small>主催者・協会のホームページやSNSの投稿URLを入れてください。</small>
          </label>
          <label className="field">
            <span>補足（参加資格・申込締切など）</span>
            <textarea name="description" maxLength={1500} />
            <small>電話番号・メールアドレスは書き込めません。</small>
          </label>
        </ActionForm>
      </div>
    </>
  );
}
