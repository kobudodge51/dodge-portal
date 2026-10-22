import type { Metadata } from "next";
import { PageHead } from "@/components/Layout";
import ActionForm from "@/components/ActionForm";
import { sendContact } from "@/app/actions";

export const metadata: Metadata = { title: "お問い合わせ・削除依頼" };

const SUBJECTS = ["投稿の削除依頼", "権利侵害の申立て", "協会HPリンクの修正", "掲載内容の誤り", "コラムについて", "その他"];

export default function ContactPage() {
  return (
    <>
      <PageHead kicker="CONTACT" title="お問い合わせ・削除依頼" lead="この内容は公開されません。返信が必要な場合は返信先をご記入ください。" />
      <div className="form-card">
        <ActionForm action={sendContact} submitLabel="送信する">
          <div className="hp" aria-hidden="true">
            <input name="website_hp" tabIndex={-1} autoComplete="off" />
          </div>
          <label className="field">
            <span>種別<em>必須</em></span>
            <select name="subject" required defaultValue="">
              <option value="" disabled>選んでください</option>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div className="row-2">
            <label className="field">
              <span>お名前（任意）</span>
              <input name="name" maxLength={40} />
            </label>
            <label className="field">
              <span>返信先メールアドレス（任意）</span>
              <input name="reply_to" type="email" maxLength={120} />
            </label>
          </div>
          <label className="field">
            <span>内容<em>必須</em></span>
            <textarea name="body" required maxLength={3000} />
            <small>削除依頼の場合は、該当ページのURLと理由を書いてください。</small>
          </label>
        </ActionForm>
      </div>
    </>
  );
}
