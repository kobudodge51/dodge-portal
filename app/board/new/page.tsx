import type { Metadata } from "next";
import { PageHead } from "@/components/Layout";
import ActionForm from "@/components/ActionForm";
import PrefSelect from "@/components/PrefSelect";
import { createThread } from "@/app/actions";
import { BOARD_CATEGORIES } from "@/lib/prefectures";

export const metadata: Metadata = { title: "スレッドを立てる" };

export default function NewThreadPage() {
  return (
    <>
      <PageHead kicker="POST" title="スレッドを立てる" lead="相手を思いやった言葉づかいでお願いします。" />
      <div className="form-card">
        <ActionForm action={createThread} submitLabel="スレッドを立てる" poster agree>
          <label className="field">
            <span>タイトル<em>必須</em></span>
            <input name="title" required maxLength={60} />
          </label>
          <div className="row-2">
            <label className="field">
              <span>カテゴリ<em>必須</em></span>
              <select name="category" required defaultValue="">
                <option value="" disabled>選んでください</option>
                {BOARD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="field">
              <span>関係する都道府県</span>
              <PrefSelect required={false} emptyLabel="指定しない" />
            </label>
          </div>
          <label className="field">
            <span>本文<em>必須</em></span>
            <textarea name="body" required maxLength={2000} />
            <small>練習試合の相手探し・メンバー募集はこの掲示板では扱いません。特定の人やチームがわかってしまう書き方はしないでください。</small>
          </label>
        </ActionForm>
      </div>
    </>
  );
}
