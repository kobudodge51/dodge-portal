import ActionForm from "./ActionForm";
import { reportItem, deleteOwn } from "@/app/actions";
import { REPORT_REASONS } from "@/lib/prefectures";

// 投稿の下に置く「通報する」「自分の投稿を削除」
export default function PostTools({ type, id, canDelete = true }: { type: "event" | "team" | "thread" | "reply"; id: string; canDelete?: boolean }) {
  return (
    <div className="post-tools">
      <details>
        <summary>通報する</summary>
        <ActionForm action={reportItem} submitLabel="通報を送る" compact>
          <input type="hidden" name="target_type" value={type} />
          <input type="hidden" name="target_id" value={id} />
          <label className="field">
            <span>理由</span>
            <select name="reason" required defaultValue="">
              <option value="" disabled>選んでください</option>
              {REPORT_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>補足（任意）</span>
            <input name="detail" maxLength={500} />
          </label>
        </ActionForm>
      </details>
      {canDelete && (
        <details>
          <summary>自分の投稿を削除</summary>
          <ActionForm action={deleteOwn} submitLabel="削除する" danger compact>
            <input type="hidden" name="target_type" value={type} />
            <input type="hidden" name="target_id" value={id} />
            <label className="field">
              <span>投稿時に決めた削除キー</span>
              <input name="delete_key" type="password" required maxLength={20} />
            </label>
          </ActionForm>
        </details>
      )}
    </div>
  );
}
