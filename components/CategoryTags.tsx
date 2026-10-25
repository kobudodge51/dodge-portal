import { splitCategories, EVENT_CATEGORY_NOTE } from "@/lib/prefectures";

const TONE: Record<string, string> = {
  オフィシャル: "cat-official",
  ジュニア: "cat-junior",
  リトル: "cat-little",
  中学生: "cat-u15",
  ファイター: "cat-fighter",
  ガールズ: "cat-girls",
};

export default function CategoryTags({ value, withNote = false }: { value: string | null | undefined; withNote?: boolean }) {
  const cats = splitCategories(value);
  return (
    <>
      {cats.map((c) => (
        <span key={c} className={`tag ${TONE[c] ?? ""}`}>
          {c}
          {withNote && EVENT_CATEGORY_NOTE[c] ? `（${EVENT_CATEGORY_NOTE[c]}）` : ""}
        </span>
      ))}
    </>
  );
}
