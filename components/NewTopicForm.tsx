"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions";

type Props = { action: (s: FormState, f: FormData) => Promise<FormState>; categories: string[]; dots: Record<string, string> };
const KEY = "dp-draft-topic";

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-big" disabled={pending}>{pending ? "公開しています…" : "この内容で公開する"}</button>
  );
}

// 話題の投稿：入力 → 確認 → 公開。書きかけはこの端末に自動で下書き保存
export default function NewTopicForm({ action, categories, dots }: Props) {
  const [state, formAction] = useActionState(action, {} as FormState);
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d) {
        setTitle(d.title ?? "");
        setBody(d.body ?? "");
        setCategory(d.category ?? "");
        setName(d.name ?? "");
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (!title && !body) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ title, body, category, name }));
        setSaved(true);
      } catch {
        /* noop */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [title, body, category, name]);

  useEffect(() => {
    if (state.error) setStep("input");
  }, [state]);

  const toConfirm = () => {
    if (!title.trim()) return setError("タイトルを入力してください。");
    if (!category) return setError("カテゴリを選んでください。");
    if (body.trim().length < 5) return setError("本文を5文字以上入力してください。");
    setError("");
    setStep("confirm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  };

  return (
    <form action={formAction} onSubmit={clearDraft} className="form">
      <ol className="steps" aria-label="投稿の流れ">
        <li className={step === "input" ? "on" : ""}><b>1</b>入力</li>
        <li className={step === "confirm" ? "on" : ""}><b>2</b>確認</li>
        <li><b>3</b>公開</li>
      </ol>

      <div hidden={step !== "input"} style={{ display: step === "input" ? "flex" : "none", flexDirection: "column", gap: 14 }}>
        <label className="field">
          <span>タイトル<em>必須</em></span>
          <input name="title" required maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例）キャッチの恐怖心を減らす練習は？" />
        </label>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: ".86rem", fontWeight: 700, fontFamily: "var(--head)", marginBottom: 6 }}>カテゴリ<em style={{ color: "var(--magenta)", fontStyle: "normal", fontSize: ".72rem", marginLeft: 6 }}>必須</em></legend>
          <div className="chip-radios">
            {categories.map((c) => (
              <label key={c} className="chip-radio" style={{ ["--dot" as string]: dots[c] }}>
                <input type="radio" name="category" value={c} checked={category === c} onChange={() => setCategory(c)} />
                <i aria-hidden="true" />{c}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>本文<em>必須</em></span>
          <textarea name="body" required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="例）小4の子がボールを怖がって手を引いてしまいます。柔らかいボールから始めるなど、練習の工夫があれば教えてください。" />
          <small>練習試合の相手探し・メンバー募集はこの掲示板では扱いません。</small>
        </label>
        <div className="notice-box">名前・学校・チーム名・写真など、人やチームがわかる書き方は投稿できません。電話番号・メールアドレスも書き込めません。</div>
        <details className="optional">
          <summary>名前・削除キー（どちらも省略できます）</summary>
          <div className="row-2">
            <label className="field">
              <span>名前</span>
              <input name="poster_name" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} placeholder="空欄なら「名無しさん」" />
            </label>
            <label className="field">
              <span>削除キー（4〜20文字）</span>
              <input name="delete_key" type="password" maxLength={20} autoComplete="new-password" placeholder="あとで自分で消すときの合言葉" />
            </label>
          </div>
        </details>
        {(error || state.error) && <p className="msg msg-error" role="alert">{error || state.error}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          {saved ? <span className="draft-note">下書きを自動保存しました</span> : <span />}
        </div>
        <button type="button" className="btn btn-primary btn-big" onClick={toConfirm}>確認画面へ →</button>
      </div>

      {step === "confirm" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="confirm-box">
            <p className="small muted" style={{ margin: 0 }}>{category}　投稿者：{name.trim() || "名無しさん"}</p>
            <h2>{title}</h2>
            <p className="prose" style={{ margin: 0 }}>{body}</p>
          </div>
          <div className="hp" aria-hidden="true">
            <label>ホームページ<input name="website_hp" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <p className="small muted" style={{ margin: 0 }}>公開するとすぐに誰でも見られるようになります。問題のある投稿は通報により非表示になることがあります。</p>
          <label className="check">
            <input type="checkbox" name="agree" required />
            <span><Link href="/terms" target="_blank">利用規約</Link>・<Link href="/guidelines" target="_blank">投稿ルール</Link>・<Link href="/privacy" target="_blank">プライバシーポリシー</Link>に同意します</span>
          </label>
          <div className="btn-row">
            <button type="button" className="btn btn-outline btn-big" onClick={() => setStep("input")}>← 直す</button>
            <PublishButton />
          </div>
        </div>
      )}
    </form>
  );
}
