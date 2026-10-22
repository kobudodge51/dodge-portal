// デジタルタイマー風のカウンター（7セグメント表示）
const SEG: Record<string, string> = {
  a: "8,3 32,3 28,8 12,8",
  b: "33,4 33,33 28,30 28,9",
  c: "33,37 33,66 28,61 28,40",
  d: "8,67 32,67 28,62 12,62",
  e: "7,37 12,40 12,61 7,66",
  f: "7,4 12,9 12,30 7,33",
  g: "9,35 13,32.5 27,32.5 31,35 27,37.5 13,37.5",
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

// value を表示。桁が足りない分は消灯した桁で埋める。colonAfter を指定するとその位置に「:」を入れる
export default function Timer({ value, digits = 5, label, colonAfter }: { value: number; digits?: number; label?: string; colonAfter?: number }) {
  const text = String(Math.max(0, Math.floor(value))).slice(-digits).padStart(digits, " ");
  return (
    <div className="timer" role="img" aria-label={`${label ?? ""} ${value.toLocaleString("ja-JP")}`}>
      <div className="timer-body">
        <span className="timer-lamp" />
        <div className="timer-screen">
          {text.split("").map((ch, i) => (
            <span key={i} style={{ display: "contents" }}>
              {colonAfter === i && (
                <span className="timer-sep"><i /><i /></span>
              )}
              <Digit ch={ch} />
            </span>
          ))}
        </div>
        <div className="timer-foot">
          <span className="logo-ball" />
          DODGE PORTAL
        </div>
      </div>
      {label && <span className="timer-label">{label}</span>}
    </div>
  );
}
