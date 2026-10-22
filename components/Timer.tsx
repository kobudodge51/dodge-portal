// デジタルタイマー風のカウンター（7セグメント表示）。小さく、数字だけを見せる
const SEG: Record<string, string> = {
  a: "9,2 31,2 26,8 14,8",
  b: "33,4 33,33 27,30 27,10",
  c: "33,37 33,66 27,60 27,40",
  d: "9,68 31,68 26,62 14,62",
  e: "7,37 13,40 13,60 7,66",
  f: "7,4 13,10 13,30 7,33",
  g: "9,35 14,31.5 26,31.5 31,35 26,38.5 14,38.5",
};
const DIGITS: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
  "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg", " ": "",
};

function Digit({ ch }: { ch: string }) {
  const on = DIGITS[ch] ?? "";
  return (
    <svg className="seg" viewBox="0 0 40 70" aria-hidden="true">
      {Object.entries(SEG).map(([k, pts]) => (
        <polygon key={k} points={pts} className={on.includes(k) ? "on" : "off"} />
      ))}
    </svg>
  );
}

export default function Timer({ value, digits = 6, label }: { value: number; digits?: number; label?: string }) {
  const text = String(Math.max(0, Math.floor(value))).slice(-digits).padStart(digits, " ");
  return (
    <div className="timer" role="img" aria-label={`${label ?? ""} ${value.toLocaleString("ja-JP")}`}>
      {label && <span className="timer-label">{label}</span>}
      <div className="timer-screen">
        {text.split("").map((ch, i) => (
          <Digit key={i} ch={ch} />
        ))}
      </div>
    </div>
  );
}
