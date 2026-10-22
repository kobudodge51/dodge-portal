import type { Metadata } from "next";
import { PageHead } from "@/components/Layout";
import ActionForm from "@/components/ActionForm";
import { submitColumn } from "@/app/actions";

export const metadata: Metadata = { title: "コラムを寄稿する" };

export default function SubmitColumnPage() {
  return (
    <>
      <PageHead kicker="CONTRIBUTE" title="コラムを寄稿する" lead="指導者・選手・保護者・審判、立場は問いません。運営が内容を確認し、掲載するものだけを公開します（掲載をお約束するものではありません）。" />
      <div className="form-card">
        <ActionForm action={submitColumn} submitLabel="寄稿を送る" agree>
          <label className="field">
            <span>タイトル<em>必須</em></span>
            <input name="title" required maxLength={80} />
          </label>
          <label className="field">
            <span>ペンネーム（掲載時の名前）<em>必須</em></span>
            <input name="author" required maxLength={30} />
          </label>
          <label className="field">
            <span>本文（100〜8000文字）<em>必須</em></span>
            <textarea name="body" required minLength={100} maxLength={8000} style={{ minHeight: 320 }} />
            <small>行頭に「## 」をつけると見出しになります。空行で段落が分かれます。ご自身で書いた文章のみ送ってください。</small>
          </label>
        </ActionForm>
      </div>
    </>
  );
}
