"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  children?: React.ReactNode;
  poster?: boolean; // 名前・削除キー欄を出す
  agree?: boolean; // 規約同意＋ボット対策欄を出す
  danger?: boolean;
  compact?: boolean;
};

function Submit({ label, danger }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={danger ? "btn btn-danger" : "btn btn-primary"} disabled={pending}>
      {pending ? "送信中…" : label}
    </button>
  );
}

export default function ActionForm({ action, submitLabel, children, poster, agree, danger, compact }: Props) {
  const [state, formAction] = useActionState(action, {} as FormState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className={compact ? "form form-compact" : "form"}>
      {children}

      {poster && (
        <div className="row-2">
          <label className="field">
            <span>投稿者名（ニックネーム可）</span>
            <input name="poster_name" maxLength={20} placeholder="名無しさん" />
          </label>
          <label className="field">
            <span>削除キー（任意・4〜20文字）</span>
            <input name="delete_key" type="password" minLength={4} maxLength={20} autoComplete="new-password" placeholder="あとで自分で削除する時に使います" />
          </label>
        </div>
      )}

      {agree && (
        <>
          <div className="hp" aria-hidden="true">
            <label>
              ホームページ
              <input name="website_hp" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="notice-box">
            子どもの氏名・顔写真・学校名、電話番号・メールアドレス・住所などの個人情報は書き込まないでください。投稿はすぐに公開され、誰でも閲覧できます。
          </div>
          <label className="check">
            <input type="checkbox" name="agree" required />
            <span>
              <Link href="/terms" target="_blank">利用規約</Link>・<Link href="/guidelines" target="_blank">投稿ルール</Link>・<Link href="/privacy" target="_blank">プライバシーポリシー</Link>に同意します
            </span>
          </label>
        </>
      )}

      {state.error && <p className="msg msg-error" role="alert">{state.error}</p>}
      {state.message && <p className="msg msg-ok" role="status">{state.message}</p>}
      <Submit label={submitLabel} danger={danger} />
    </form>
  );
}
