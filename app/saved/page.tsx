import type { Metadata } from "next";
import SavedList from "@/components/SavedList";

export const metadata: Metadata = { title: "保存した話題" };

export default function SavedPage() {
  return (
    <div className="wrap section">
      <h1 className="disp-head"><span>SAVED</span>保存した話題</h1>
      <p className="small muted">保存はこの端末のブラウザに記録されます（ログイン不要）。別のスマホやパソコンには引き継がれません。</p>
      <SavedList />
    </div>
  );
}
