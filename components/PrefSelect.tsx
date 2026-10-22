import { BLOCKS, PREFECTURES } from "@/lib/prefectures";

export default function PrefSelect({ name = "prefecture", required = true, defaultValue = "", emptyLabel = "選んでください" }: { name?: string; required?: boolean; defaultValue?: string; emptyLabel?: string }) {
  return (
    <select name={name} required={required} defaultValue={defaultValue}>
      <option value="">{emptyLabel}</option>
      {BLOCKS.map((b) => (
        <optgroup key={b} label={b}>
          {PREFECTURES.filter((p) => p.block === b).map((p) => (
            <option key={p.code} value={p.name}>
              {p.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
