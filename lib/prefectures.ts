export type Pref = { code: string; name: string; block: string };

export const BLOCKS = ["北海道", "東北", "関東", "北信越", "東海", "関西", "中国", "四国", "九州・沖縄"] as const;

export const PREFECTURES: Pref[] = [
  { code: "hokkaido", name: "北海道", block: "北海道" },
  { code: "aomori", name: "青森県", block: "東北" },
  { code: "iwate", name: "岩手県", block: "東北" },
  { code: "miyagi", name: "宮城県", block: "東北" },
  { code: "akita", name: "秋田県", block: "東北" },
  { code: "yamagata", name: "山形県", block: "東北" },
  { code: "fukushima", name: "福島県", block: "東北" },
  { code: "ibaraki", name: "茨城県", block: "関東" },
  { code: "tochigi", name: "栃木県", block: "関東" },
  { code: "gunma", name: "群馬県", block: "関東" },
  { code: "saitama", name: "埼玉県", block: "関東" },
  { code: "chiba", name: "千葉県", block: "関東" },
  { code: "tokyo", name: "東京都", block: "関東" },
  { code: "kanagawa", name: "神奈川県", block: "関東" },
  { code: "yamanashi", name: "山梨県", block: "関東" },
  { code: "niigata", name: "新潟県", block: "北信越" },
  { code: "toyama", name: "富山県", block: "北信越" },
  { code: "ishikawa", name: "石川県", block: "北信越" },
  { code: "fukui", name: "福井県", block: "北信越" },
  { code: "nagano", name: "長野県", block: "北信越" },
  { code: "gifu", name: "岐阜県", block: "東海" },
  { code: "shizuoka", name: "静岡県", block: "東海" },
  { code: "aichi", name: "愛知県", block: "東海" },
  { code: "mie", name: "三重県", block: "東海" },
  { code: "shiga", name: "滋賀県", block: "関西" },
  { code: "kyoto", name: "京都府", block: "関西" },
  { code: "osaka", name: "大阪府", block: "関西" },
  { code: "hyogo", name: "兵庫県", block: "関西" },
  { code: "nara", name: "奈良県", block: "関西" },
  { code: "wakayama", name: "和歌山県", block: "関西" },
  { code: "tottori", name: "鳥取県", block: "中国" },
  { code: "shimane", name: "島根県", block: "中国" },
  { code: "okayama", name: "岡山県", block: "中国" },
  { code: "hiroshima", name: "広島県", block: "中国" },
  { code: "yamaguchi", name: "山口県", block: "中国" },
  { code: "tokushima", name: "徳島県", block: "四国" },
  { code: "kagawa", name: "香川県", block: "四国" },
  { code: "ehime", name: "愛媛県", block: "四国" },
  { code: "kochi", name: "高知県", block: "四国" },
  { code: "fukuoka", name: "福岡県", block: "九州・沖縄" },
  { code: "saga", name: "佐賀県", block: "九州・沖縄" },
  { code: "nagasaki", name: "長崎県", block: "九州・沖縄" },
  { code: "kumamoto", name: "熊本県", block: "九州・沖縄" },
  { code: "oita", name: "大分県", block: "九州・沖縄" },
  { code: "miyazaki", name: "宮崎県", block: "九州・沖縄" },
  { code: "kagoshima", name: "鹿児島県", block: "九州・沖縄" },
  { code: "okinawa", name: "沖縄県", block: "九州・沖縄" },
];

export const PREF_NAMES = PREFECTURES.map((p) => p.name);
export const prefByCode = (code: string) => PREFECTURES.find((p) => p.code === code);
export const prefByName = (name: string) => PREFECTURES.find((p) => p.name === name);

// 大会区分（1つの大会に複数つけられる。データベースには「,」区切りで保存）
export const EVENT_CATEGORIES = ["オフィシャル", "ジュニア", "リトル", "中学生", "ファイター", "ガールズ"];
export const EVENT_CATEGORY_NOTE: Record<string, string> = {
  オフィシャル: "D-1",
  ジュニア: "",
  リトル: "",
  中学生: "U-15",
  ファイター: "S-1",
  ガールズ: "D-1G・S-1G",
};
export const splitCategories = (c: string | null | undefined) => (c ?? "").split(",").map((x) => x.trim()).filter((x) => EVENT_CATEGORIES.includes(x));
export const TEAM_CATEGORIES = ["D-1", "D-1G", "S-1", "S-1G"];
export const TEAM_CATEGORY_LABEL: Record<string, string> = { "D-1": "オフィシャル", "D-1G": "ガールズ・小学生", "S-1": "ファイター", "S-1G": "ガールズ・中学生以上" };
export const blockPrefNames = (block: string) => PREFECTURES.filter((p) => p.block === block).map((p) => p.name);
export const BOARD_CATEGORIES = ["みんな教えて！", "大会情報", "指導・練習方法", "その他"];
export const REPORT_REASONS = [
  "個人情報が書かれている",
  "誹謗中傷・攻撃的な内容",
  "子どもの安全に関わる内容",
  "内容が誤っている・古い",
  "宣伝・スパム",
  "その他",
];

// 登録チームの部門バッジの色
export const TEAM_CATEGORY_CLASS: Record<string, string> = { "D-1": "cat-official", "D-1G": "cat-d1g", "S-1": "cat-fighter", "S-1G": "cat-girls" };
