// 都道府県ドッジボール協会のホームページ一覧
// 出典：日本ドッジボール協会「都道府県協会」ページ（2026年10月時点）
// URLが変わったときは、この一覧の該当行を書き換えてください。
export const ASSOCIATIONS: Record<string, string | null> = {
  北海道: "http://www.hdba.server-shared.com/",
  青森県: null,
  岩手県: "https://iwate-dodgeball.wixsite.com/idba",
  宮城県: "https://www.miyagidodgeball.jp/",
  秋田県: "http://adban.web.fc2.com/",
  山形県: null,
  福島県: "http://dodgeball.html.xdomain.jp/index.html",
  茨城県: "https://www.idba.jp",
  栃木県: "https://sites.google.com/view/tdba",
  群馬県: "https://www.gunma-dba.com",
  埼玉県: "https://members.db-saitama.com/doku.php",
  千葉県: "http://www.cdba.jp/",
  東京都: "https://www.tdba.jp",
  神奈川県: "https://kdba.jp/",
  山梨県: "https://ydba.sakura.ne.jp/",
  新潟県: "https://jdba-niigata.blogspot.com",
  富山県: "http://dodgeball.web.fc2.com/",
  石川県: "https://ishikawa-dodgeball.com",
  福井県: "http://kore.mitene.or.jp/~fdba/index.html",
  長野県: "http://www.jdba-nagano.jp/",
  岐阜県: "https://sites.google.com/view/jdba-gifudodge/%E3%83%9B%E3%83%BC%E3%83%A0",
  静岡県: "https://www.shizuoka-dba.com",
  愛知県: "https://www.aichidba.org/",
  三重県: "https://jdba-mie.zzzx.jp",
  滋賀県: "https://shiga-dodgeball.jimdofree.com",
  京都府: "https://kyoto.cyber-ninja.jp/index.html",
  大阪府: "https://www.osaka-dodgeball.com/",
  兵庫県: "http://hyogododge.xrea.jp/",
  奈良県: "https://naradodgeball.wixsite.com/ndba",
  和歌山県: "https://www.eonet.ne.jp/~wdba",
  鳥取県: null,
  島根県: null,
  岡山県: "https://okayama-dba.jimdofree.com",
  広島県: null,
  山口県: "https://jdbayamaguchi.fc2.page/",
  徳島県: null,
  香川県: null,
  愛媛県: "https://dodgeball-ehime.jpn.org",
  高知県: "https://sites.google.com/view/kochidodge",
  福岡県: "https://jdba-fukuoka.jp",
  佐賀県: null,
  長崎県: "https://jdba-nagasaki.com",
  熊本県: null,
  大分県: null,
  宮崎県: "https://yucochaa.wixsite.com/ikimekkoclub",
  鹿児島県: "https://kagoshimadodgeball.jimdofree.com",
  沖縄県: "https://okinawadodgeballassociation.jimdofree.com/",
};

export const JDBA_URL = "https://www.dodgeball.or.jp/";

// ブロック（地域連盟・連絡会）
// 2026年11月時点。東海は愛知県協会HP内のページ、九州ブロック連絡会はFacebookページ。北海道は北海道協会がブロックを兼ねる。
export type BlockAssoc = { block: string; name: string; url?: string; urlLabel?: string; note: string; pattern: string };
export const BLOCK_ASSOCIATIONS: BlockAssoc[] = [
  { block: "北海道", name: "北海道ドッジボール協会（北海道ブロック）", url: "http://www.hdba.server-shared.com/", urlLabel: "協会HP", note: "北海道は1道で1ブロック。北海道協会のホームページがブロックの窓口です。", pattern: "北海道" },
  { block: "東北", name: "東北ブロック", note: "専用ホームページなし。各県協会（宮城・岩手など）が大会を案内しています。", pattern: "東北" },
  { block: "関東", name: "関東ブロック", note: "専用ホームページなし。関東選手権などは開催県の協会が案内しています（山梨県は関東ブロック）。", pattern: "関東" },
  { block: "北信越", name: "北信越ブロック", note: "専用ホームページなし。開催県の協会（新潟・長野・富山など）が案内しています。", pattern: "北信越" },
  { block: "東海", name: "東海ブロック連絡会", url: encodeURI("https://www.aichidba.org/東海ブロック大会etc/"), urlLabel: "大会ページ", note: "愛知県協会のホームページ内「東海ブロック大会etc」に、東海ブロックの大会日程と結果（PDF）がまとめて載っています。", pattern: "東海" },
  { block: "関西", name: "関西ブロック", note: "専用ホームページなし。開催府県の協会が案内しています。", pattern: "関西" },
  { block: "中国", name: "中国ブロック", note: "専用ホームページなし。広島・山口などの各県協会が案内しています。", pattern: "中国" },
  { block: "四国", name: "四国ブロック", note: "専用ホームページなし。愛媛・香川などの各県協会が案内しています。", pattern: "四国" },
  { block: "九州・沖縄", name: "九州ブロック連絡会", url: "https://www.facebook.com/jdbakyushu", urlLabel: "Facebook", note: "九州・沖縄8県のブロック。大会のお知らせはFacebookページで発信されています。", pattern: "九州" },
];

// 県協会の中の支部・市協会（大会を独自に運営しているところ）
export type SubAssoc = { name: string; url?: string; note?: string };
const AICHI_SCHEDULE = encodeURI("https://www.aichidba.org/年間スケジュール/");
export const SUB_ASSOCIATIONS: Record<string, SubAssoc[]> = {
  愛知県: [
    { name: "名古屋支部（名古屋市ドッジボール協会）", url: AICHI_SCHEDULE, note: "理事長杯・しゃちほこ杯・あいち・なごやっ子など" },
    { name: "尾張支部", url: AICHI_SCHEDULE, note: "尾張クラウンズカップなど" },
    { name: "三河支部", url: AICHI_SCHEDULE, note: "参河桜杯・三河支部長杯・クリスマスカップなど" },
  ],
};
