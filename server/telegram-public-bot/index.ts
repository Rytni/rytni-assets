import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SECRET_MISSION_FACTS, SECRET_MISSION_INTROS } from "./secret_mission_content.ts";

import { restoredNotificationText, restoredMediaKind } from "./restored-notifications.js";

type TelegramUser = { id?: number; username?: string; first_name?: string };
type TelegramChat = { id?: number; type?: string };
type TelegramMessage = {
  message_id?: number;
  text?: string;
  caption?: string;
  photo?: unknown[];
  chat?: TelegramChat;
  from?: TelegramUser;
};
type TelegramCallback = {
  id?: string;
  data?: string;
  from?: TelegramUser;
  message?: TelegramMessage;
};
type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallback;
};
type EmojiMap = Record<string, string>;
type Subscription = {
  id: string;
  telegram_user_id: number;
  telegram_chat_id: number;
  active: boolean;
  notify_chest: boolean;
  notify_sponsor_chest: boolean;
  notify_arcade: boolean;
  notify_question: boolean;
  notify_videos: boolean;
  notify_winner: boolean;
  notify_secret_missions: boolean;
  quiet_hours_enabled: boolean;
  timezone_offset_minutes: number;
  quiet_start_minutes: number;
  quiet_end_minutes: number;
};
type SecretMissionJob = {
  action: "offer" | "expire";
  mission_id: string;
  subscription_id: string;
  telegram_chat_id: number;
  telegram_message_id: number | null;
  fact_index: number;
  text_variant: number;
  image_index: number;
  reward_points: number;
};
type DueNotification = {
  delivery_id: string;
  subscription_id: string;
  telegram_chat_id: number;
  kind: "chest" | "question" | "videos" | "winner" | "sponsor_chest" | "arcade_fly" | "arcade_snake";
  payload: Record<string, unknown> | null;
};
type SupportDelivery = { delivery_id: string; subscription_id: string; telegram_chat_id: number; outcome_code: "in_progress" | "fixed" | "no_issue" | "needs_info" | "rejected" | "resolved"; public_reply: string };
type AnnouncementJob = {
  action: "send" | "expire";
  delivery_id: string;
  announcement_id: string;
  subscription_id: string;
  telegram_chat_id: number;
  telegram_message_id: number | null;
  announcement_type: "info" | "important";
  body: string;
  image_index: number;
  reward_points: number;
  expires_at: string;
  allow_questions: boolean;
  question_submitted: boolean;
  accepted: boolean;
};
type OracleGame = { id: string; steam_app_id: number; title: string; duration: string; why: string; caveat: string; cover_url: string; store_url: string; match_reasons?: string[]; match_style?: string };

const SITE_URL = "https://rytni.live/rytni-gift";
const BOT_USERNAME = "Rytni_Give_BOT";
const SECRET_MISSION_MEDIA = (() => {
  try {
    const encoded = Deno.env.get("TELEGRAM_SECRET_MISSION_MEDIA_IDS_B64") || "";
    const value = JSON.parse(encoded ? atob(encoded) : "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.length > 20).slice(0, 15) : [];
  } catch { return []; }
})();
const ORACLE_MEDIA = (() => {
  try {
    const encoded = Deno.env.get("TELEGRAM_ORACLE_MEDIA_IDS_B64") || "";
    const value = JSON.parse(encoded ? atob(encoded) : "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(value).map(([key, ids]) => [
      key,
      Array.isArray(ids) ? ids.filter((item) => typeof item === "string" && item.length > 20).slice(0, 4) : [],
    ]).filter(([, ids]) => (ids as string[]).length > 0)) as Record<string, string[]>;
  } catch { return {} as Record<string, string[]>; }
})();
const UI_MEDIA = (() => {
  try {
    const encoded = Deno.env.get("TELEGRAM_UI_MEDIA_IDS_B64") || "";
    const value = JSON.parse(encoded ? atob(encoded) : "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(value).filter(([, fileId]) =>
      typeof fileId === "string" && fileId.length > 20
    )) as Record<string, string>;
  } catch { return {} as Record<string, string>; }
})();
const ANNOUNCEMENT_QUESTION_MEDIA = (() => {
  try {
    const encoded = Deno.env.get("TELEGRAM_ANNOUNCEMENT_QUESTION_MEDIA_IDS_B64") || "";
    const value = JSON.parse(encoded ? atob(encoded) : "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(value).filter(([, fileId]) =>
      typeof fileId === "string" && fileId.length > 20
    )) as Record<string, string>;
  } catch { return {} as Record<string, string>; }
})();
const ANNOUNCEMENT_MEDIA = (() => {
  try {
    const encoded = Deno.env.get("TELEGRAM_ANNOUNCEMENT_MEDIA_IDS_B64") || "";
    const value = JSON.parse(encoded ? atob(encoded) : "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.length > 20).slice(0, 15) : [];
  } catch { return [] as string[]; }
})();
const NOTIFICATION_MEDIA: Record<"chest" | "question" | "videos" | "winner", string[]> = {
  chest: [
    "AgACAgIAAxkDAAMwanuEFyhnR8Pw5k-p-pJTEwABGLUtAAK2IWsbGGHZS6YESlp4RD6tAQADAgADdwADPQQ",
    "AgACAgIAAxkDAAMxanuEGWYUfUbx_tauU7SIkZjz8fwAArchaxsYYdlLLEZ1CtSB7-ABAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAMyanuEHDOciW76VYpez4QKVmTYuvEAArghaxsYYdlLJsC1W9KwQ_ABAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAMzanuEH4BdoWX5mz952fTT8dMh63IAArkhaxsYYdlLYOgcNDql8BcBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM0anuEIneU-QABJPF0K59gIDgbGwl1AAK6IWsbGGHZS0o7FnZ1fkLIAQADAgADdwADPQQ",
    "AgACAgIAAxkDAAM1anuEJIPhhvu3kJhkjt5qgIrOUGQAArshaxsYYdlLBt7i-6tLUXkBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM2anuEJ3OPtyoxeK1kCEKgyxqrONUAArwhaxsYYdlLEYZ6B6BoiX0BAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM3anuEKcHOMDMjVA0tqKWmjLDSoD8AAr0haxsYYdlLSjNJIiWBa-ABAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM4anuELJhVQeokrGR3vSJ6ENg1r70AAr4haxsYYdlLCP04oNj1XLEBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM5anuEL4mw05wDWcibBzD2rKO5klAAAr8haxsYYdlLkYPB371zN_MBAAMCAAN3AAM9BA",
  ],
  question: [
    "AgACAgIAAxkDAAM6anuEMZLEqNmS2I-sNy1mNLoPqygAAsAhaxsYYdlLHTxgBihjeVUBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM7anuENXR3cUMeUITrgJ-EZmCswZUAAsEhaxsYYdlL7y3TAZ155RMBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM8anuEONBCM7RuO5_R8yxr4CRi6toAAsIhaxsYYdlL7qklyvfREzcBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM9anuEOvsVKNNrjjHZm7fJVbld7HMAAsMhaxsYYdlLWtnbLU-X36YBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM-anuEPXLyfRLpaCQ9C7UbdLJ_nk0AAsQhaxsYYdlL29aVkZdD2R8BAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAAM_anuEQFZWFZGcAAH-5OJNOTqETB8dAALFIWsbGGHZSyi2URGnB8CIAQADAgADdwADPQQ",
    "AgACAgIAAxkDAANAanuEQwhILFHpIbPLsCCo_vlCfhYAAsYhaxsYYdlLaGr3zWlrrzUBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANBanuERb2HNdhe4gdvcJQ6AQku-TMAAsghaxsYYdlLoumMocUddywBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANCanuESLTqLApJGGKIuNDXsmyCdLsAAskhaxsYYdlLz-FGXmB17N8BAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANDanuESiOg_MBGXXnITwzDCTHVYuAAAsohaxsYYdlLkw-G0JNHZ-0BAAMCAAN3AAM9BA",
  ],
  videos: [
    "AgACAgIAAxkDAANEanuETfdw2aaoWC8-R3E5niqHKcAAAsshaxsYYdlLoy1bIUfvdfwBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANFanuEUIgJZzcvFs_RRo6_HtNCQPgAAswhaxsYYdlLasKKEhxUET8BAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANGanuEUgaigUftrWY3kNXyA09Gx-EAAs0haxsYYdlLnmnb4boleIIBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANHanuEVdwepZDcc131GJ2dvbVvNhQAAs4haxsYYdlLkrJAEuIWoSgBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANIanuEV6DGmi1ql74GqGhHxeiui4MAAs8haxsYYdlLWgEnPD0v0tcBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANJanuEWg6H2Mbj6apM-lz8AAGz5NXdAALQIWsbGGHZS3G2hp1ex5IHAQADAgADdwADPQQ",
    "AgACAgIAAxkDAANKanuEXRP2VYgDiR23MU7EYm7pBWEAAtEhaxsYYdlLKxNzDMEb1dEBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANLanuEX0O80PYDi24YmxBOB0powaoAAtIhaxsYYdlL5SoCEjpCA3ABAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANManuEYjdHKCQLuaoEzyeiKh-JhYEAAtMhaxsYYdlLLGSWG2abb9IBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANNanuEZbRl1RrB20O9XLXKssqYbVsAAtQhaxsYYdlLvSy0m1fDj1gBAAMCAAN3AAM9BA",
  ],
  winner: [
    "AgACAgIAAxkDAANOanuEZzJqzEqixzHhQWnNyg9VYmYAAtUhaxsYYdlLHTNBhprC7rQBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANPanuEaqLVaXzn12hr8blSmaRw0u4AAtYhaxsYYdlLNBVPLbC3BTYBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANQanuEbDjxpbD2v0TN61k7efgzD7oAAtchaxsYYdlL0E94CfM9XrYBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANRanuEb8eHFu2WMFO6PIA1jfJOhTAAAtghaxsYYdlLnNyeoLDiXTQBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANSanuEcpucGRU2w6K_axKdFhgVqU4AAtkhaxsYYdlLZbTSgXXk1EMBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANTanuEdcqzAVU81sX9QULjq6lIKmAAAtohaxsYYdlLZDfcsx267nIBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANUanuEdy13xCVRXJrNAAHDJhVOFSaKAALbIWsbGGHZS5KEVUUXPH8NAQADAgADdwADPQQ",
    "AgACAgIAAxkDAANVanuEepN5KqDmVFL1PeGztYBVncsAAtwhaxsYYdlLsvhXCkfsBgUBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANWanuEfKYnzA7fpgFE9kbdBsKBdS4AAt0haxsYYdlLS75ig7clnfcBAAMCAAN3AAM9BA",
    "AgACAgIAAxkDAANXanuEf7wWSmEwxk1S0UwTe1z_oPYAAt4haxsYYdlL76HD27EguYQBAAMCAAN3AAM9BA",
  ],
};
const REQUIRED_EMOJI_KEYS = [
  "chest_ready", "question_ready", "new_videos", "support_like",
  "comment", "winner", "steam_request", "notification",
] as const;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const loadEmojiMap = (): EmojiMap => {
  try {
    const encoded = Deno.env.get("TELEGRAM_PUBLIC_EMOJI_IDS_B64") || "";
    const source = encoded ? atob(encoded) : (Deno.env.get("TELEGRAM_PUBLIC_EMOJI_IDS") || "{}");
    const value = JSON.parse(source) as EmojiMap;
    return Object.fromEntries(Object.entries(value).filter(([key, id]) =>
      REQUIRED_EMOJI_KEYS.includes(key as typeof REQUIRED_EMOJI_KEYS[number])
      && /^\d{8,32}$/.test(String(id))
    ));
  } catch {
    return {};
  }
};

const emoji = (map: EmojiMap, key: string, fallback: string) => {
  const id = map[key];
  return id ? `<tg-emoji emoji-id="${id}">${fallback}</tg-emoji>` : fallback;
};

const serviceClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const telegramCall = async (method: string, body: Record<string, unknown>) => {
  const token = Deno.env.get("TELEGRAM_PUBLIC_BOT_TOKEN") || "";
  if (!token) throw new Error("telegram_token_missing");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok !== true) {
    const error = new Error(String(result?.description || `telegram_${response.status}`));
    (error as Error & { status?: number }).status = Number(result?.error_code || response.status);
    throw error;
  }
  return result;
};

const telegramReply = (message: TelegramMessage, text: string, replyMarkup?: Record<string, unknown>) => json({
  method: "sendMessage",
  chat_id: message.chat?.id,
  text,
  parse_mode: "HTML",
  link_preview_options: { is_disabled: true },
  ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
});

const telegramPhotoReply = (message: TelegramMessage, photo: string, caption: string, replyMarkup?: Record<string, unknown>) =>
  photo ? json({
    method: "sendPhoto",
    chat_id: message.chat?.id,
    photo,
    caption,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  }) : telegramReply(message, caption, replyMarkup);

const siteButton = {
  inline_keyboard: [[{ text: "🎁 Открыть Rytni Подари", url: SITE_URL }]],
};
const hideReplyKeyboard = { remove_keyboard: true };

const mainMenuKeyboard = (subscription: Subscription) => ({
  inline_keyboard: [
    [{ text: "🎮 Игровой оракул", callback_data: "oracle:start" }],
    [{ text: "⚙️ Настроить уведомления", callback_data: "nav:settings" }],
    [{ text: "🛡 Помощь и безопасность", callback_data: "nav:help" }],
    [{ text: "🎁 Открыть Rytni Подари", url: SITE_URL }],
  ],
});

const helpKeyboard = (subscription: Subscription | null) => ({
  inline_keyboard: [
    ...(subscription ? [
      [{ text: "🛟 Обратиться в поддержку", callback_data: "support:start" }],
      [{ text: "🤖 Проверить подключение", callback_data: "nav:status" }],
      [{ text: subscription.active ? "🔕 Приостановить уведомления" : "🔔 Возобновить уведомления", callback_data: "nav:active" }],
    ] : []),
    [{ text: "🎁 Открыть Rytni Подари", url: SITE_URL }],
    [{ text: "⬅️ Главное меню", callback_data: "nav:main" }],
  ],
});

type OracleIntent = "new" | "replay" | "coop" | "trust";
const ORACLE_AVOIDS = ["text", "stress", "grind", "reflex", "difficulty", "horror", "early_access"] as const;
const oracleIntentKeyboard = { inline_keyboard: [
  [{ text: "🆕 Найти новую игру", callback_data: "oracle:i:new" }],
  [{ text: "🔁 Перепройти легенду", callback_data: "oracle:i:replay" }],
  [{ text: "🤝 Найти игру вместе", callback_data: "oracle:i:coop" }],
  [{ text: "🎲 Довериться Оракулу", callback_data: "oracle:i:trust" }],
  [{ text: "⬅️ Помощь и безопасность", callback_data: "nav:help" }],
] };
const oracleTimeKeyboard = (intent: OracleIntent) => ({ inline_keyboard: [
  [{ text: "🌙 На один вечер", callback_data: `oracle:t:${intent}:evening` }],
  [{ text: "🗓 На несколько дней", callback_data: `oracle:t:${intent}:few_days` }],
  [{ text: "🧭 Надолго", callback_data: `oracle:t:${intent}:long` }],
  [{ text: "⬅️ Назад", callback_data: "oracle:start" }],
] });
const oracleCoopKeyboard = (time: string) => ({ inline_keyboard: [
  [{ text: "🛋 За одним устройством", callback_data: `oracle:c:${time}:local` }],
  [{ text: "🌐 По сети", callback_data: `oracle:c:${time}:online` }],
  [{ text: "🤝 Неважно", callback_data: `oracle:c:${time}:any` }],
  [{ text: "⬅️ Назад", callback_data: "oracle:i:coop" }],
] });
const oracleTrustSignKeyboard = (time: string) => ({ inline_keyboard: [
  [{ text: "🌙 Тихое созвездие", callback_data: `oracle:s:${time}:calm` }],
  [{ text: "⚡ Искра риска", callback_data: `oracle:s:${time}:spark` }],
  [{ text: "🔮 Неизвестный сигнал", callback_data: `oracle:s:${time}:mystery` }],
  [{ text: "⬅️ Назад", callback_data: "oracle:i:trust" }],
] });
const oracleMoodKeyboard = (intent: string, time: string, mode: string) => ({ inline_keyboard: [
  [{ text: "☕ Расслабиться", callback_data: `oracle:m:${intent}:${time}:${mode}:relax` }, { text: "📖 История", callback_data: `oracle:m:${intent}:${time}:${mode}:story` }],
  [{ text: "🧩 Подумать", callback_data: `oracle:m:${intent}:${time}:${mode}:think` }, { text: "🔥 Испытание", callback_data: `oracle:m:${intent}:${time}:${mode}:challenge` }],
  [{ text: "👻 Пощекотать нервы", callback_data: `oracle:m:${intent}:${time}:${mode}:horror` }, { text: "✨ Удивиться", callback_data: `oracle:m:${intent}:${time}:${mode}:surprise` }],
  [{ text: "⬅️ Назад", callback_data: intent === "coop" ? `oracle:t:coop:${time}` : `oracle:i:${intent}` }],
] });
const oracleAvoidKeyboard = (intent: string, time: string, mode: string, mood: string, mask: number) => {
  const option = (index: number, label: string) => ({
    text: `${mask & (1 << index) ? "✅" : "○"} ${label}`,
    callback_data: `oracle:x:${intent}:${time}:${mode}:${mood}:${mask}:${index}`,
  });
  return { inline_keyboard: [
    [option(0, "Много текста"), option(1, "Напряжение")],
    [option(2, "Гринд"), option(3, "Нужна реакция")],
    [option(4, "Высокая сложность"), option(5, "Хоррор")],
    [option(6, "Ранний доступ")],
    [{ text: "🧹 Сбросить", callback_data: `oracle:x:${intent}:${time}:${mode}:${mood}:${mask}:reset` },
     { text: "Продолжить ➜", callback_data: `oracle:x:${intent}:${time}:${mode}:${mood}:${mask}:done` }],
  ] };
};
const oracleDiscoveryKeyboard = (intent: string, time: string, mode: string, mood: string, mask: number) => ({ inline_keyboard: [
  [{ text: "🛡 Точное совпадение", callback_data: `oracle:p:${intent}:${time}:${mode}:${mood}:${mask}:safe` }],
  [{ text: "💎 Неочевидная находка", callback_data: `oracle:p:${intent}:${time}:${mode}:${mood}:${mask}:gem` }],
  [{ text: "🎲 Смелый вариант", callback_data: `oracle:p:${intent}:${time}:${mode}:${mood}:${mask}:surprise` }],
] });
const oracleResultKeyboard = (game: OracleGame) => ({ inline_keyboard: [
  [{ text: "🎮 Открыть в Steam", url: game.store_url }],
  [{ text: "💜 Хочу попробовать", callback_data: `oracle:f:i:${game.id}` }, { text: "✅ Уже играл", callback_data: `oracle:f:p:${game.id}` }],
  [{ text: "❌ Не моё", callback_data: `oracle:f:d:${game.id}` }, { text: "🎲 Другой вариант", callback_data: "oracle:next" }],
  [{ text: "🔄 Пройти заново", callback_data: "oracle:start" }, { text: "⬅️ Меню", callback_data: "nav:main" }],
] });
const oracleFeedbackReasonKeyboard = (gameId: string) => ({ inline_keyboard: [
  [{ text: "✅ Уже играл", callback_data: `oracle:r:already_played:${gameId}` }, { text: "🎭 Не люблю жанр", callback_data: `oracle:r:genre:${gameId}` }],
  [{ text: "🧱 Слишком сложно", callback_data: `oracle:r:too_hard:${gameId}` }, { text: "👻 Слишком страшно", callback_data: `oracle:r:too_scary:${gameId}` }],
  [{ text: "⏳ Слишком долго", callback_data: `oracle:r:too_long:${gameId}` }, { text: "🚧 Ранний доступ", callback_data: `oracle:r:early_access:${gameId}` }],
  [{ text: "🇷🇺 Нет русского языка", callback_data: `oracle:r:no_russian:${gameId}` }, { text: "🎨 Не нравится стиль", callback_data: `oracle:r:visual_style:${gameId}` }],
  [{ text: "🤷 Просто не заинтересовало", callback_data: `oracle:r:not_interested:${gameId}` }],
] });
const oracleIntroText = "🎮 <b>Игровой оракул Rytni</b>\n\nОракул учитывает ваш сегодняшний запрос, прошлые реакции и честные ограничения каждой игры.\n\n<b>Что ищем сегодня?</b>";
const oracleResultText = (game: OracleGame) => [
  `🎮 <b>${escapeHtml(game.title)}</b>`,
  game.duration ? `⏱ ${escapeHtml(game.duration)}` : "",
  "",
  `<b>Почему Rytni рекомендует:</b> ${escapeHtml(game.why)}`,
  "",
  `<b>Стоит учесть:</b> ${escapeHtml(game.caveat)}`,
  "",
  "💜 <b>Личная рекомендация Rytni</b> — игры для Оракула я подбираю сам.",
].filter(Boolean).join("\n");

const guestMenuKeyboard = {
  inline_keyboard: [
    [{ text: "🎁 Подключить на сайте", url: SITE_URL }],
    [{ text: "🛡 Помощь и безопасность", callback_data: "nav:help" }],
  ],
};
const supportCategoriesKeyboard = { inline_keyboard: [
  [{ text: "✉️ Email и подтверждение", callback_data: "support:category:email_confirmation" }],
  [{ text: "📝 Заявка", callback_data: "support:category:application" }, { text: "🔗 Telegram", callback_data: "support:category:telegram" }],
  [{ text: "🪙 Очки", callback_data: "support:category:points" }, { text: "🎬 Видео", callback_data: "support:category:video" }],
  [{ text: "🎁 Сундук", callback_data: "support:category:chest" }, { text: "❓ Вопрос", callback_data: "support:category:question" }],
  [{ text: "🌐 Работа сайта", callback_data: "support:category:site" }, { text: "💬 Другое", callback_data: "support:category:other" }],
  [{ text: "⬅️ Главное меню", callback_data: "nav:main" }],
] };
const supportCancelKeyboard = { inline_keyboard: [[{ text: "✖️ Отменить обращение", callback_data: "support:cancel" }]] };
const supportStartText = ["🛟 <b>Поддержка Rytni</b>", "", "Выберите тему обращения. Email, Telegram и данные вашей заявки прикрепятся автоматически.", "", "После выбора одним сообщением подробно опишите, что произошло и что вы ожидали увидеть."].join("\n");

const backKeyboard = (linked = true) => ({
  inline_keyboard: [
    [{ text: "⬅️ Главное меню", callback_data: "nav:main" }],
    [{ text: linked ? "🎁 Открыть Rytni Подари" : "🎁 Подключить на сайте", url: SITE_URL }],
  ],
});

const settingsKeyboard = (subscription: Subscription) => ({
  inline_keyboard: [
    [{ text: `${subscription.notify_sponsor_chest ? "✅" : "❌"} Сундук от спонсора`, callback_data: "pref:sponsor_chest" },
     { text: `${subscription.notify_arcade ? "✅" : "❌"} Попытки Аркады`, callback_data: "pref:arcade" }],
    [{ text: `${subscription.notify_chest ? "✅" : "❌"} Сундук`, callback_data: "pref:chest" },
     { text: `${subscription.notify_question ? "✅" : "❌"} Игровой вопрос`, callback_data: "pref:question" }],
    [{ text: `${subscription.notify_videos ? "✅" : "❌"} Новые ролики`, callback_data: "pref:videos" },
     { text: `${subscription.notify_winner ? "✅" : "❌"} Победа`, callback_data: "pref:winner" }],
    [{ text: `${subscription.notify_secret_missions ? "✅" : "❌"} Секретные личные задания`, callback_data: "pref:secret_missions" }],
    [{ text: `${subscription.quiet_hours_enabled ? "🌙 Тихие часы включены" : "🌙 Настроить тихие часы"}`, callback_data: "quiet:menu" }],
    [{ text: "⬅️ Главное меню", callback_data: "nav:main" }],
  ],
});

const testMenuKeyboard = {
  inline_keyboard: [
    [{ text: "🎁 Спонсорский сундук", callback_data: "test:preview:sponsor_chest:0" }],
    [{ text: "🎮 Fly", callback_data: "test:preview:arcade_fly:0" }, { text: "🐍 Snake", callback_data: "test:preview:arcade_snake:0" }],
    [{ text: "🎁 Сундук", callback_data: "test:preview:chest:0" },
     { text: "❓ Игровой вопрос", callback_data: "test:preview:question:0" }],
    [{ text: "🎬 Новые ролики", callback_data: "test:preview:videos:0" },
     { text: "🏆 Победа", callback_data: "test:preview:winner:0" }],
  ],
};

const testPreviewKeyboard = (kind: DueNotification["kind"], variant: number) => ({
  inline_keyboard: [
    [{ text: "⬅️", callback_data: `test:preview:${kind}:${(variant + 9) % 10}` },
     { text: `${variant + 1} / 10`, callback_data: "test:none" },
     { text: "➡️", callback_data: `test:preview:${kind}:${(variant + 1) % 10}` }],
    [{ text: "🎁 Сундук", callback_data: `test:preview:chest:${variant}` },
     { text: "❓ Вопрос", callback_data: `test:preview:question:${variant}` }],
    [{ text: "🎬 Ролики", callback_data: `test:preview:videos:${variant}` },
     { text: "🏆 Победа", callback_data: `test:preview:winner:${variant}` }],
    [{ text: "🎁 Открыть Rytni Подари", url: SITE_URL }],
  ],
});

const testMenuText = [
  "🧪 <b>Проверка уведомлений</b>",
  "",
  "Выберите тип сообщения. Предпросмотр приходит только владельцу и не затрагивает очередь, участников или базу данных.",
].join("\n");

const mainMenuText = (map: EmojiMap, subscription: Subscription) => [
  `${emoji(map, "notification", "🔔")} <b>Rytni Подари</b>`,
  "",
  `Telegram подключён · уведомления <b>${subscription.active ? "включены" : "приостановлены"}</b>`,
  "Выберите раздел.",
].join("\n");

const statusText = (map: EmojiMap, subscription: Subscription) => [
  `${emoji(map, "notification", "🔔")} <b>Состояние подключения</b>`,
  "",
  "Telegram: <b>подключён</b>",
  `Уведомления: <b>${subscription.active ? "включены" : "приостановлены"}</b>`,
  `${subscription.quiet_hours_enabled ? "🌙" : "☀️"} Тихие часы: <b>${subscription.quiet_hours_enabled ? `${formatClock(subscription.quiet_start_minutes)}–${formatClock(subscription.quiet_end_minutes)}` : "выключены"}</b>`,
].join("\n");

const startText = (map: EmojiMap, linked = false) => [
  `${emoji(map, "notification", "🔔")} <b>${linked ? "Всё готово — Telegram подключён" : "Добро пожаловать в Rytni Подари"}</b>`,
  "",
  linked ? "Важные события заявки теперь придут сюда." : "Подключите Telegram в карточке заявки на сайте, чтобы получать важные напоминания.",
  "",
  "🛡 Бот не просит пароль Steam, код или оплату за подарок.",
].join("\n");

const helpText = (map: EmojiMap) => [
  `${emoji(map, "notification", "🛡")} <b>Помощь и безопасность</b>`,
  "",
  "Здесь можно проверить связь, временно отключить сообщения или написать в поддержку.",
  "Бот никогда не просит пароль Steam, код подтверждения или оплату.",
].join("\n");

const settingsText = (map: EmojiMap, subscription: Subscription) => [
  `${emoji(map, "notification", "🔔")} <b>Настройки уведомлений</b>`,
  "",
  `Общий статус: <b>${subscription.active ? "уведомления включены" : "уведомления приостановлены"}</b>`,
  "✅ — присылать · ❌ — не присылать",
  "",
  `🌙 Тихие часы: <b>${subscription.quiet_hours_enabled ? "включены" : "выключены"}</b>`,
  `🎁 Сундук от спонсора: <b>${subscription.notify_sponsor_chest ? "включены" : "выключены"}</b>`,
  `🎮 Попытки Fly и Snake: <b>${subscription.notify_arcade ? "включены" : "выключены"}</b>`,
  `🕵️ Секретные личные задания: <b>${subscription.notify_secret_missions ? "включены" : "выключены"}</b>`,
  "Изменения сохраняются сразу.",
].join("\n");

const normalizeDayMinutes = (value: number) => ((Math.round(value) % 1440) + 1440) % 1440;
const normalizeOffsetMinutes = (value: number) => Math.max(-720, Math.min(840, Math.round(value / 15) * 15));
const formatClock = (minutes: number) => {
  const normalized = normalizeDayMinutes(minutes);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
};
const formatOffset = (minutes: number) => {
  const normalized = normalizeOffsetMinutes(minutes);
  const sign = normalized >= 0 ? "+" : "−";
  const absolute = Math.abs(normalized);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
};
const currentLocalMinutes = (offsetMinutes: number) => {
  const now = new Date(Date.now() + normalizeOffsetMinutes(offsetMinutes) * 60_000);
  return now.getUTCHours() * 60 + now.getUTCMinutes();
};

const quietSettingsText = (map: EmojiMap, subscription: Subscription) => [
  `${emoji(map, "notification", "🌙")} <b>Тихие часы</b>`,
  "",
  `Статус: <b>${subscription.quiet_hours_enabled ? "включены" : "выключены"}</b>`,
  `Ваше местное время: <b>${formatClock(currentLocalMinutes(subscription.timezone_offset_minutes))}</b>`,
  `Часовой пояс: <b>${formatOffset(subscription.timezone_offset_minutes)}</b>`,
  `Не беспокоить: <b>${formatClock(subscription.quiet_start_minutes)}–${formatClock(subscription.quiet_end_minutes)}</b>`,
  "Уведомления за это время придут позже.",
].join("\n");

const quietSettingsKeyboard = (subscription: Subscription) => ({
  inline_keyboard: [
    [{ text: subscription.quiet_hours_enabled ? "✅ Ночной режим включён" : "❌ Ночной режим выключен", callback_data: "quiet:toggle" }],
    [{ text: "−30 мин", callback_data: "quiet:start:-30" },
     { text: `🌙 С ${formatClock(subscription.quiet_start_minutes)}`, callback_data: "quiet:none" },
     { text: "+30 мин", callback_data: "quiet:start:30" }],
    [{ text: "−30 мин", callback_data: "quiet:end:-30" },
     { text: `☀️ До ${formatClock(subscription.quiet_end_minutes)}`, callback_data: "quiet:none" },
     { text: "+30 мин", callback_data: "quiet:end:30" }],
    [{ text: "−1 час", callback_data: "quiet:tz:-60" },
     { text: `🌍 У вас ${formatClock(currentLocalMinutes(subscription.timezone_offset_minutes))}`, callback_data: "quiet:none" },
     { text: "+1 час", callback_data: "quiet:tz:60" }],
    [{ text: "−15 мин", callback_data: "quiet:tz:-15" },
     { text: formatOffset(subscription.timezone_offset_minutes), callback_data: "quiet:none" },
     { text: "+15 мин", callback_data: "quiet:tz:15" }],
    [{ text: "⬅️ К настройкам", callback_data: "nav:settings" }],
  ],
});

const loadSubscription = async (telegramUserId: number) => {
  const { data, error } = await serviceClient().from("giveaway_telegram_subscriptions")
    .select("id,telegram_user_id,telegram_chat_id,active,notify_chest,notify_sponsor_chest,notify_arcade,notify_question,notify_videos,notify_winner,notify_secret_missions,quiet_hours_enabled,timezone_offset_minutes,quiet_start_minutes,quiet_end_minutes")
    .eq("telegram_user_id", telegramUserId).maybeSingle();
  if (error) throw error;
  return data as Subscription | null;
};
const loadSupportDraft = async (subscriptionId: string) => {
  const { data, error } = await serviceClient().from("giveaway_telegram_support_drafts").select("category,expires_at").eq("subscription_id", subscriptionId).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw error;
  return data as { category: string; expires_at: string } | null;
};
const loadAnnouncementQuestionDraft = async (subscriptionId: string) => {
  const { data, error } = await serviceClient().from("giveaway_telegram_announcement_question_drafts")
    .select("delivery_id,expires_at,prompt_message_id,validation_message_id").eq("subscription_id", subscriptionId)
    .gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw error;
  return data as { delivery_id: string; expires_at: string; prompt_message_id?: number | null; validation_message_id?: number | null } | null;
};
const deleteTelegramMessage = async (chatId: number, messageId?: number | null) => {
  if (!messageId) return;
  await telegramCall("deleteMessage", { chat_id: chatId, message_id: messageId }).catch(() => null);
};
const sendAnnouncementQuestionCard = async (
  chatId: number,
  mediaKey: "question_prompt" | "too_short" | "too_long" | "question_sent",
  caption: string,
  replyMarkup?: Record<string, unknown>,
) => {
  const photo = ANNOUNCEMENT_QUESTION_MEDIA[mediaKey] || "";
  return photo
    ? telegramCall("sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "HTML", ...(replyMarkup ? { reply_markup: replyMarkup } : {}) })
    : telegramCall("sendMessage", { chat_id: chatId, text: caption, parse_mode: "HTML", ...(replyMarkup ? { reply_markup: replyMarkup } : {}) });
};
const createSupportTicket = async (telegramUserId: number, category: string, description: string) => {
  const { data, error } = await serviceClient().rpc("telegram_create_support_ticket_v2200", { p_telegram_user_id: telegramUserId, p_category: category, p_description: description });
  if (error) throw error;
  return data as { success?: boolean; status?: string };
};

const parseStartToken = (text: string) => {
  const match = text.trim().match(/^\/start(?:@Rytni_Give_BOT)?(?:\s+([A-Za-z0-9_-]{24,128}))?$/i);
  return match?.[1] || "";
};

const claimLink = async (message: TelegramMessage, token: string) => {
  const { data, error } = await serviceClient().rpc("telegram_claim_link_v2180", {
    p_code: token,
    p_telegram_user_id: message.from!.id,
    p_telegram_chat_id: message.chat!.id,
    p_telegram_username: message.from?.username || null,
  });
  if (error) throw error;
  return data as { success?: boolean; status?: string };
};

const hashedVariant = (seed: string, count: number) => {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
};

const notificationVariant = (item: DueNotification, count: number) =>
  hashedVariant(`text:${item.kind}:${item.delivery_id}:${item.subscription_id}`, count);

const notificationMedia = (item: DueNotification, forcedVariant?: number) => {
  const media = NOTIFICATION_MEDIA[restoredMediaKind(item.kind) as keyof typeof NOTIFICATION_MEDIA];
  const selected = Number.isInteger(forcedVariant)
    ? Math.min(media.length - 1, Math.max(0, Number(forcedVariant)))
    : hashedVariant(`media:${item.kind}:${item.delivery_id}:${item.subscription_id}`, media.length);
  return media[selected];
};

const notificationText = (map: EmojiMap, item: DueNotification, forcedVariant?: number) => {
  const payload = item.payload || {};
  const restored = restoredNotificationText(item.kind, payload);
  if (restored) return restored;
  const chest = emoji(map, "chest_ready", "🎁");
  const question = emoji(map, "question_ready", "❓");
  const videos = emoji(map, "new_videos", "🎬");
  const winner = emoji(map, "winner", "🏆");
  const steam = emoji(map, "steam_request", "🎮");
  const like = emoji(map, "support_like", "❤️");
  const comment = emoji(map, "comment", "💬");

  const joinVariant = (variants: string[][]) => {
    const selected = Number.isInteger(forcedVariant)
      ? Math.min(variants.length - 1, Math.max(0, Number(forcedVariant)))
      : notificationVariant(item, variants.length);
    return variants[selected].join("\n");
  };

  if (item.kind === "winner") {
    return joinVariant([
      [`${winner} <b>Поздравляем — вы выбраны победителем Rytni Подари!</b>`, "", `${steam} Проверьте Steam, вам должен вот-вот прийти запрос от Rytni.`],
      [`${winner} <b>Отличная новость — вы победитель Rytni Подари!</b>`, "", "Ваша заявка выбрана владельцем проекта.", "", `${steam} Проверьте Steam: запрос от Rytni должен прийти совсем скоро.`],
      [`${winner} <b>Сегодня удача на вашей стороне!</b>`, "", "Вы выбраны победителем Rytni Подари.", "", `${steam} Загляните в Steam — ожидайте запрос от Rytni.`],
      [`${winner} <b>Победное уведомление!</b>`, "", "Rytni выбрал вашу заявку победителем.", "", `${steam} Проверьте входящие запросы Steam — запрос от Rytni уже в пути.`],
      [`${winner} <b>Ваш звёздный момент настал!</b>`, "", "Поздравляем, вы выбраны победителем Rytni Подари.", "", `${steam} Скоро в Steam появится запрос от Rytni.`],
      [`${winner} <b>Есть победа!</b>`, "", "Ваша заявка выбрана в Rytni Подари.", "", `${steam} Проверьте Steam — вам должен вот-вот прийти запрос от Rytni.`],
      [`${winner} <b>Поздравляем с победой в Rytni Подари!</b>`, "", "Вы вошли в число выбранных победителей.", "", `${steam} Откройте Steam и ожидайте запрос от Rytni.`],
      [`${winner} <b>Для вас есть особенная новость!</b>`, "", "Вы выбраны победителем Rytni Подари.", "", `${steam} Не пропустите входящий запрос от Rytni в Steam.`],
      [`${winner} <b>Ваша заявка победила!</b>`, "", "Поздравляем — Rytni выбрал вас победителем.", "", `${steam} Проверьте Steam: запрос от Rytni должен появиться в ближайшее время.`],
      [`${winner} <b>Финальный сигнал — победа!</b>`, "", "Вы выбраны победителем Rytni Подари. Поздравляем!", "", `${steam} Загляните в Steam, запрос от Rytni скоро придёт.`],
    ]);
  }

  if (item.kind === "chest") {
    return joinVariant([
      [`${chest} <b>Сундук снова доступен</b>`, "", "Заберите награду и продолжите серию открытий."],
      [`${chest} <b>Ваш сундук готов к открытию</b>`, "", "Награда уже ждёт вас в Rytni Подари."],
      [`${chest} <b>Пора за новой наградой</b>`, "", "Сундук восстановился — откройте его и сохраните темп."],
      [`${chest} <b>Сундук снова заряжен</b>`, "", "Возвращайтесь за наградой и продолжайте прокачку заявки."],
      [`${chest} <b>Обнаружен доступный сундук</b>`, "", "Откройте его сейчас, чтобы начать ожидание следующего."],
      [`${chest} <b>Новая добыча уже рядом</b>`, "", "Сундук доступен — заберите очки и двигайтесь дальше."],
      [`${chest} <b>Время открыть сундук</b>`, "", "Награда восстановилась и готова пополнить ваш прогресс."],
      [`${chest} <b>Сундук вышел из перезарядки</b>`, "", "Загляните в Rytni Подари и заберите содержимое."],
      [`${chest} <b>Ваш следующий сундук готов</b>`, "", "Не оставляйте награду ждать — серия открытий продолжается."],
      [`${chest} <b>Сигнал из хранилища</b>`, "", "Сундук снова можно открыть. Награда ждёт своего владельца."],
    ]);
  }

  if (item.kind === "question") {
    return joinVariant([
      [`${question} <b>Игровой вопрос восстановился</b>`, "", "Ответьте на новый вопрос и продолжите прокачку заявки."],
      [`${question} <b>Доступен новый игровой вопрос</b>`, "", "Проверьте знания и получите следующую возможность заработать очки."],
      [`${question} <b>Вопрос снова готов</b>`, "", "Возвращайтесь в Rytni Подари — вас ждёт новое испытание."],
      [`${question} <b>Пора проверить игровые знания</b>`, "", "Новый вопрос уже доступен в вашей заявке."],
      [`${question} <b>Перезарядка вопроса завершена</b>`, "", "Выберите ответ и продолжайте движение к следующему уровню."],
      [`${question} <b>Новое испытание открыто</b>`, "", "Игровой вопрос восстановился — попробуйте ответить правильно."],
      [`${question} <b>Ваша следующая викторина готова</b>`, "", "Загляните на сайт и заработайте прогресс верным ответом."],
      [`${question} <b>Система подготовила новый вопрос</b>`, "", "Самое время вернуться и продолжить прокачку."],
      [`${question} <b>Игровой вопрос ждёт ответа</b>`, "", "Откройте Rytni Подари и проверьте свою интуицию."],
      [`${question} <b>Новый вопрос уже на орбите</b>`, "", "Ответьте на него и сделайте ещё один шаг вперёд."],
    ]);
  }

  const count = Math.max(1, Number(payload.count) || 1);
  const available = count === 1 ? "Доступен новый ролик" : `Доступны новые ролики: ${count}`;
  return joinVariant([
    [`${videos} <b>${available}</b>`, "", "Посмотрите не менее 90%, чтобы получить очки.", "", `${like} Лайк и ${comment} комментарий в TikTok помогают Rytni выпускать новые ролики и проводить такие розыгрыши. Спасибо за поддержку!`],
    [`${videos} <b>В ленте появилось новое задание</b>`, "", `${count === 1 ? "Ролик уже доступен" : `Новых роликов: ${count}`}. Досмотрите каждый минимум до 90%, чтобы получить награду.`, "", `${like} Реакция и ${comment} содержательный комментарий поддерживают проект и помогают делать новые розыгрыши.`],
    [`${videos} <b>Новые ролики ждут просмотра</b>`, "", `${count === 1 ? "Открыт 1 новый ролик" : `Открыто новых роликов: ${count}`}. Просмотр от 90% засчитывается автоматически.`, "", `${like} Поддержите публикацию лайком и ${comment} комментарием — это действительно помогает Rytni.`],
    [`${videos} <b>Появились свежие TikTok-задания</b>`, "", `${count === 1 ? "Доступен один ролик" : `Доступно роликов: ${count}`}. Посмотрите не менее 90% каждого для начисления очков.`, "", `${like} Лайки и ${comment} комментарии помогают роликам находить зрителей, а проекту — развиваться.`],
    [`${videos} <b>Пополнение в разделе видео</b>`, "", `${available}. Дождитесь отметки о просмотре после 90%.`, "", `${like} Если ролик понравился, поддержите его реакцией и ${comment} комментарием в TikTok.`],
    [`${videos} <b>Новая возможность заработать очки</b>`, "", `${count === 1 ? "Посмотрите новый ролик" : `Посмотрите новые ролики — ${count}`}, не перематывая и не закрывая раньше 90%.`, "", `${like} Ваша активность и ${comment} комментарии помогают таким розыгрышам оставаться возможными.`],
    [`${videos} <b>Видео-квест обновлён</b>`, "", `${count === 1 ? "Добавлено новое задание" : `Добавлено заданий: ${count}`}. За просмотр от 90% начисляются очки.`, "", `${like} Лайк и ${comment} живой комментарий — лучшая поддержка новых публикаций Rytni.`],
    [`${videos} <b>На странице появились новые ролики</b>`, "", `${count === 1 ? "Вас ждёт 1 просмотр" : `Вас ждут просмотры: ${count}`}. Выполните условие 90%, чтобы забрать награду.`, "", `${like} Поддержите автора реакцией и ${comment} комментарием — благодаря этому проект растёт.`],
    [`${videos} <b>Свежий контент уже доступен</b>`, "", `${available}. Полный зачёт начинается после 90% просмотра.`, "", `${like} Лайк и ${comment} комментарий помогают TikTok показать ролик большему числу людей и поддерживают новые розыгрыши.`],
    [`${videos} <b>Поступили новые видео-задания</b>`, "", `${count === 1 ? "Один ролик готов к просмотру" : `Роликов готово: ${count}`}. Досмотрите их минимум до 90% и получите очки.`, "", `${like} Не забудьте поддержать Rytni лайком и ${comment} комментарием — спасибо, что помогаете проекту.`],
  ]);
};

const testNotificationItem = (kind: DueNotification["kind"], variant: number): DueNotification => ({
    delivery_id: `test-${kind}-${variant}`,
    subscription_id: "owner-preview",
    telegram_chat_id: 0,
    kind,
    payload: kind === "videos" ? { count: 3 } : {},
});

const testNotificationText = (map: EmojiMap, kind: DueNotification["kind"], variant: number) => {
  const item = testNotificationItem(kind, variant);
  return [
    notificationText(map, item, variant),
    "",
    `<i>Тестовый просмотр · вариант ${variant + 1} из 10</i>`,
  ].join("\n");
};

const runNotifications = async () => {
  const service = serviceClient();
  const { data, error } = await service.rpc("telegram_claim_due_notifications_v2292", { p_limit: 100 });
  if (error) throw error;
  const items = (Array.isArray(data) ? data : []) as DueNotification[];
  const map = loadEmojiMap();
  let sent = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await telegramCall("sendPhoto", {
        chat_id: item.telegram_chat_id,
        photo: notificationMedia(item),
        caption: notificationText(map, item),
        parse_mode: "HTML",
        reply_markup: siteButton,
      });
      await service.rpc("telegram_finish_delivery_v2180", {
        p_delivery_id: item.delivery_id, p_success: true, p_error: null,
      });
      sent += 1;
    } catch (error) {
      const message = String((error as Error)?.message || error).slice(0, 450);
      const blocked = [400, 403].includes(Number((error as Error & { status?: number })?.status));
      await service.rpc("telegram_finish_delivery_v2180", {
        p_delivery_id: item.delivery_id, p_success: false, p_error: message,
      });
      if (blocked) {
        await service.from("giveaway_telegram_subscriptions").update({
          active: false, blocked_at: new Date().toISOString(), last_error: message,
        }).eq("id", item.subscription_id);
      }
      failed += 1;
    }
  }
  return { ok: true, claimed: items.length, sent, failed };
};
const supportDeliveryText = (item: SupportDelivery) => {
  const outcomes: Record<SupportDelivery["outcome_code"], [string,string]> = {
    in_progress:["Обращение принято в работу","Мы начали проверку вашего обращения."], fixed:["Проблема исправлена","Проверка завершена, необходимое исправление выполнено."],
    no_issue:["Проблема не обнаружена","Во время проверки указанная ошибка не подтвердилась."], needs_info:["Нужны дополнительные данные","Для продолжения проверки нам не хватает информации."],
    rejected:["Обращение отклонено","Проверка не выявила основания для дальнейшей обработки обращения."], resolved:["Обращение рассмотрено","Проверка вашего обращения завершена."],
  };
  const [title,summary]=outcomes[item.outcome_code]||outcomes.resolved;
  return ["🛟 <b>Ответ поддержки Rytni</b>","",`<b>${title}</b>`,summary,...(item.public_reply?["",`<b>Ответ:</b>\n${escapeHtml(item.public_reply)}`]:[]),"","Если вопрос сохранился, создайте новое обращение через меню бота."].join("\n");
};
const runSupportDeliveries = async () => {
  const service=serviceClient(); const {data,error}=await service.rpc("telegram_claim_support_deliveries_v2200",{p_limit:100}); if(error) throw error;
  const items=(Array.isArray(data)?data:[]) as SupportDelivery[]; let sent=0; let failed=0;
  for(const item of items){try{const result=await telegramCall("sendMessage",{chat_id:item.telegram_chat_id,text:supportDeliveryText(item),parse_mode:"HTML",link_preview_options:{is_disabled:true},reply_markup:siteButton}); await service.rpc("telegram_finish_support_delivery_v2200",{p_delivery_id:item.delivery_id,p_success:true,p_message_id:Number(result?.result?.message_id||0)||null,p_error:null}); sent+=1;}catch(error){await service.rpc("telegram_finish_support_delivery_v2200",{p_delivery_id:item.delivery_id,p_success:false,p_message_id:null,p_error:String((error as Error)?.message||error).slice(0,450)}); failed+=1;}}
  return {claimed:items.length,sent,failed};
};

const announcementCaption = (
  body: string,
  state: "open" | "accepted" | "expired",
  rewardPoints = 0,
) => {
  const ending = state === "accepted"
    ? ["✅ <b>Спасибо, что остаётесь со мной.</b>", ...(rewardPoints > 0 ? [`🎁 Начислено ${rewardPoints} очков.`] : [])]
    : state === "expired"
      ? ["⌛ <b>Подтверждение объявления закрыто.</b>"]
      : [];
  return ["📣 <b>Объявление от Rytni</b>", "", escapeHtml(body), ...(ending.length ? ["", ...ending] : [])].join("\n");
};

const announcementKeyboard = (
  deliveryId: string,
  rewardPoints: number,
  allowQuestions: boolean,
  accepted: boolean,
  questionSubmitted: boolean,
) => {
  const acceptText = accepted
    ? "✅ Объявление принято"
    : rewardPoints > 0 ? `✅ Принято · получить ${rewardPoints} очков` : "✅ Принято";
  const rows: Array<Array<{ text: string; callback_data: string }>> = [
    [{ text: acceptText, callback_data: `announcement:accept:${deliveryId}` }],
  ];
  if (allowQuestions) rows.push([{
    text: questionSubmitted ? "✅ Вопрос отправлен" : "❓ Задать вопрос Rytni",
    callback_data: `announcement:question:${deliveryId}`,
  }]);
  return { inline_keyboard: rows };
};
const announcementQuestionKeyboard = (deliveryId: string) => ({
  inline_keyboard: [[{ text: "✖️ Отменить вопрос", callback_data: `announcement:qcancel:${deliveryId}` }]],
});

const runAnnouncements = async () => {
  const service = serviceClient();
  const { data, error } = await service.rpc("telegram_claim_announcement_jobs_v2310", { p_limit: 20 });
  if (error) throw error;
  const jobs = (Array.isArray(data) ? data : []) as AnnouncementJob[];
  let sent = 0; let expired = 0; let failed = 0;
  for (const job of jobs) {
    try {
      if (job.action === "expire") {
        if (job.telegram_message_id) await telegramCall("editMessageCaption", {
          chat_id: job.telegram_chat_id, message_id: job.telegram_message_id,
          caption: announcementCaption(job.body, job.accepted ? "accepted" : "expired", job.accepted ? job.reward_points : 0), parse_mode: "HTML",
          reply_markup: { inline_keyboard: [] },
        });
        await service.rpc("telegram_finish_announcement_expiry_v2300", { p_delivery_id: job.delivery_id });
        expired += 1;
        continue;
      }
      const photo = ANNOUNCEMENT_MEDIA[job.image_index];
      if (!photo) throw new Error("announcement_media_not_configured");
      const result = await telegramCall("sendPhoto", {
        chat_id: job.telegram_chat_id, photo,
        caption: announcementCaption(job.body, "open", job.reward_points), parse_mode: "HTML",
        reply_markup: announcementKeyboard(job.delivery_id, job.reward_points, job.allow_questions, false, false),
      });
      const messageId = Number(result?.result?.message_id || 0);
      if (!messageId) throw new Error("announcement_message_id_missing");
      await service.rpc("telegram_finish_announcement_delivery_v2300", {
        p_delivery_id: job.delivery_id, p_success: true, p_message_id: messageId, p_error: null,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      if (job.action === "send") {
        const message = String((error as Error)?.message || error).slice(0, 450);
        const blocked = [400, 403].includes(Number((error as Error & { status?: number })?.status));
        await service.rpc("telegram_finish_announcement_delivery_v2300", {
          p_delivery_id: job.delivery_id, p_success: false, p_message_id: null, p_error: message,
        });
        if (blocked) await service.from("giveaway_telegram_subscriptions").update({
          active: false, blocked_at: new Date().toISOString(), last_error: message,
        }).eq("id", job.subscription_id);
      }
    }
  }
  return { claimed: jobs.length, sent, expired, failed };
};

const secretMissionCaption = (job: SecretMissionJob, state: "offer" | "claimed" | "expired") => {
  const fact = SECRET_MISSION_FACTS[job.fact_index] || SECRET_MISSION_FACTS[0];
  const intro = SECRET_MISSION_INTROS[job.text_variant] || SECRET_MISSION_INTROS[0];
  const ending = state === "offer"
    ? `⏱ <b>Награда: +${job.reward_points} очков</b>\nКнопка действует ровно 10 минут.`
    : state === "claimed"
      ? `✅ <b>Бонус получен: +${job.reward_points} очков</b>`
      : "⌛ <b>Бонус сгорел, в следующий раз будьте быстрее.</b>";
  return ["🕵️ <b>Секретное личное задание</b>", "", ...(state === "offer" ? [intro, ""] : []),
    `🎮 <b>Игровой факт · ${escapeHtml(fact.game)}</b>`, escapeHtml(fact.fact),
    `<a href="${escapeHtml(fact.source)}">Официальный источник</a>`, "", ending].join("\n");
};

const runSecretMissions = async () => {
  const service = serviceClient();
  const { data, error } = await service.rpc("telegram_claim_secret_mission_jobs_v2190", { p_limit: 100 });
  if (error) throw error;
  const jobs = (Array.isArray(data) ? data : []) as SecretMissionJob[];
  let offered = 0; let expired = 0; let failed = 0;
  for (const job of jobs) {
    try {
      if (job.action === "expire") {
        if (job.telegram_message_id) await telegramCall("editMessageCaption", {
          chat_id: job.telegram_chat_id, message_id: job.telegram_message_id,
          caption: secretMissionCaption(job, "expired"), parse_mode: "HTML", reply_markup: { inline_keyboard: [] },
        });
        await service.rpc("telegram_finish_secret_mission_expiry_v2190", { p_mission_id: job.mission_id });
        expired += 1;
        continue;
      }
      const photo = SECRET_MISSION_MEDIA[job.image_index];
      if (!photo) throw new Error("secret_mission_media_not_configured");
      const result = await telegramCall("sendPhoto", {
        chat_id: job.telegram_chat_id, photo, caption: secretMissionCaption(job, "offer"), parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: `⚡ Забрать +${job.reward_points} очков`, callback_data: `mission:claim:${job.mission_id}` }]] },
      });
      const messageId = Number(result?.result?.message_id || 0);
      if (!messageId) throw new Error("secret_mission_message_id_missing");
      await service.rpc("telegram_finish_secret_mission_offer_v2190", {
        p_mission_id: job.mission_id, p_success: true, p_message_id: messageId, p_error: null,
      });
      offered += 1;
    } catch (error) {
      failed += 1;
      if (job.action === "offer") await service.rpc("telegram_finish_secret_mission_offer_v2190", {
        p_mission_id: job.mission_id, p_success: false, p_message_id: null,
        p_error: String((error as Error)?.message || error).slice(0, 450),
      });
    }
  }
  return { claimed: jobs.length, offered, expired, failed };
};

const handleCallback = async (callback: TelegramCallback, map: EmojiMap) => {
  const userId = callback.from?.id;
  const chatId = callback.message?.chat?.id;
  const messageId = callback.message?.message_id;
  if (!userId || !chatId || !messageId || !callback.id) return json({ ok: true, status: "ignored" });
  const action = String(callback.data || "");
  let subscription = await loadSubscription(userId);
  const editMessage = async (text: string, replyMarkup: Record<string, unknown>) => {
    if (Array.isArray(callback.message?.photo) && callback.message.photo.length > 0) {
      await telegramCall("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true }, reply_markup: replyMarkup });
      await telegramCall("deleteMessage", { chat_id: chatId, message_id: messageId });
    } else {
      await telegramCall("editMessageText", {
        chat_id: chatId, message_id: messageId, text, parse_mode: "HTML",
        link_preview_options: { is_disabled: true }, reply_markup: replyMarkup,
      });
    }
  };
  const oracleMediaFor = (section: string, choice: string) => {
    const exact = ORACLE_MEDIA[`${section}/${choice}`] || [];
    const candidates = choice === "*"
      ? Object.entries(ORACLE_MEDIA).filter(([key]) => key.startsWith(`${section}/`)).flatMap(([, ids]) => ids)
      : exact;
    if (!candidates.length) return "";
    const seed = `${messageId}:${section}:${choice}`;
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index += 1) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return candidates[(hash >>> 0) % candidates.length];
  };
  const editOracleCard = async (section: string, choice: string, text: string, replyMarkup: Record<string, unknown>) => {
    const photo = oracleMediaFor(section, choice);
    if (!photo) return editMessage(text, replyMarkup);
    const media = { type: "photo", media: photo, caption: text, parse_mode: "HTML" };
    if (Array.isArray(callback.message?.photo) && callback.message.photo.length > 0) {
      await telegramCall("editMessageMedia", { chat_id: chatId, message_id: messageId, media, reply_markup: replyMarkup });
    } else {
      await telegramCall("sendPhoto", { chat_id: chatId, photo, caption: text, parse_mode: "HTML", reply_markup: replyMarkup });
      await telegramCall("deleteMessage", { chat_id: chatId, message_id: messageId });
    }
  };
  const editUiCard = async (key: string, text: string, replyMarkup: Record<string, unknown>) => {
    const photo = UI_MEDIA[key] || "";
    if (!photo) return editMessage(text, replyMarkup);
    const media = { type: "photo", media: photo, caption: text, parse_mode: "HTML" };
    if (Array.isArray(callback.message?.photo) && callback.message.photo.length > 0) {
      await telegramCall("editMessageMedia", { chat_id: chatId, message_id: messageId, media, reply_markup: replyMarkup });
    } else {
      await telegramCall("sendPhoto", { chat_id: chatId, photo, caption: text, parse_mode: "HTML", reply_markup: replyMarkup });
      await telegramCall("deleteMessage", { chat_id: chatId, message_id: messageId });
    }
  };

  if (action.startsWith("announcement:accept:")) {
    const deliveryId = action.slice("announcement:accept:".length);
    if (!/^[0-9a-f-]{36}$/i.test(deliveryId)) return json({ ok: true, status: "ignored" });
    const { data, error } = await serviceClient().rpc("telegram_accept_announcement_v2300", {
      p_delivery_id: deliveryId, p_telegram_user_id: userId,
    });
    if (error) throw error;
    const result = data as { success?: boolean; status?: string; body?: string; reward_points?: number };
    const { data: stateData, error: stateError } = await serviceClient().rpc("telegram_get_announcement_delivery_state_v2310", {
      p_delivery_id: deliveryId, p_telegram_user_id: userId,
    });
    if (stateError) throw stateError;
    const state = stateData as { success?: boolean; body?: string; reward_points?: number; allow_questions?: boolean; question_submitted?: boolean; accepted?: boolean; open?: boolean };
    const accepted = state.accepted === true || result.success === true || result.status === "already_accepted";
    await telegramCall("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: result.success ? (Number(result.reward_points || 0) > 0 ? `Начислено ${result.reward_points} очков` : "Спасибо!")
        : result.status === "already_accepted" ? "Вы уже подтвердили это объявление." : "Срок подтверждения завершён.",
      show_alert: !result.success,
    });
    await telegramCall("editMessageCaption", {
      chat_id: chatId, message_id: messageId,
      caption: announcementCaption(String(state.body || result.body || callback.message?.caption || ""), accepted ? "accepted" : "expired", Number(state.reward_points || result.reward_points || 0)),
      parse_mode: "HTML",
      reply_markup: state.open
        ? announcementKeyboard(deliveryId, Number(state.reward_points || 0), Boolean(state.allow_questions), accepted, Boolean(state.question_submitted))
        : { inline_keyboard: [] },
    });
    return json({ ok: true });
  }

  if (action.startsWith("announcement:qcancel:")) {
    const deliveryId = action.slice("announcement:qcancel:".length);
    if (!/^[0-9a-f-]{36}$/i.test(deliveryId)) return json({ ok: true, status: "ignored" });
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: "Вопрос отменён" }).catch(() => null);
    if (subscription) {
      const draft = await loadAnnouncementQuestionDraft(subscription.id);
      await deleteTelegramMessage(chatId, draft?.prompt_message_id);
      await deleteTelegramMessage(chatId, draft?.validation_message_id);
      await serviceClient().from("giveaway_telegram_announcement_question_drafts")
        .delete().eq("subscription_id", subscription.id).eq("delivery_id", deliveryId);
    }
    return json({ ok: true });
  }

  if (action.startsWith("announcement:question:")) {
    const deliveryId = action.slice("announcement:question:".length);
    if (!/^[0-9a-f-]{36}$/i.test(deliveryId)) return json({ ok: true, status: "ignored" });
    // Acknowledge the Telegram callback before any database round trip. On a
    // cold Edge Function start an old callback otherwise expires and Telegram
    // shows a generic command error even though the draft was created.
    await telegramCall("answerCallbackQuery", {
      callback_query_id: callback.id, text: "Открываю поле для вопроса…",
    }).catch(() => null);
    const { data, error } = await serviceClient().rpc("telegram_begin_announcement_question_v2310", {
      p_delivery_id: deliveryId, p_telegram_user_id: userId,
    });
    if (error) throw error;
    const result = data as { success?: boolean; status?: string };
    if (result.success !== true) {
      const messages: Record<string, string> = {
        already_submitted: "Вы уже отправили вопрос к этому объявлению.",
        expired: "Приём вопросов к этому объявлению завершён.",
        questions_disabled: "Для этого объявления вопросы не предусмотрены.",
      };
      return telegramReply(
        callback.message!,
        messages[result.status || ""] || "Не удалось открыть форму вопроса.",
      );
    }
    const previousDraft = subscription ? await loadAnnouncementQuestionDraft(subscription.id) : null;
    await deleteTelegramMessage(chatId, previousDraft?.prompt_message_id);
    await deleteTelegramMessage(chatId, previousDraft?.validation_message_id);
    const promptResult = await sendAnnouncementQuestionCard(
      chatId,
      "question_prompt",
      [
        "❓ <b>Ваш вопрос для Rytni</b>", "",
        "Напишите вопрос следующим сообщением.",
        "Самые интересные вопросы могут попасть в будущие видео Rytni.", "",
        "От 10 до 500 символов · один вопрос к объявлению.",
      ].join("\n"),
      announcementQuestionKeyboard(deliveryId),
    );
    const promptMessageId = Number(promptResult?.result?.message_id || 0);
    if (subscription && promptMessageId) await serviceClient().from("giveaway_telegram_announcement_question_drafts")
      .update({ prompt_message_id: promptMessageId, validation_message_id: null })
      .eq("subscription_id", subscription.id);
    return json({ ok: true });
  }

  if (action.startsWith("mission:claim:")) {
    const missionId = action.slice("mission:claim:".length);
    if (!/^[0-9a-f-]{36}$/i.test(missionId)) return json({ ok: true, status: "ignored" });
    const { data, error } = await serviceClient().rpc("telegram_claim_secret_mission_v2190", {
      p_mission_id: missionId, p_telegram_user_id: userId,
    });
    if (error) throw error;
    const result = data as { success?: boolean; status?: string; reward_points?: number; fact_index?: number; text_variant?: number };
    const job: SecretMissionJob = {
      action: "offer", mission_id: missionId, subscription_id: subscription?.id || "", telegram_chat_id: chatId,
      telegram_message_id: messageId, fact_index: Number(result.fact_index || 0), text_variant: Number(result.text_variant || 0),
      image_index: 0, reward_points: Number(result.reward_points || 100),
    };
    const alreadyClaimed = result.status === "already_claimed";
    const state = result.success || alreadyClaimed ? "claimed" : "expired";
    await telegramCall("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: result.success ? `Бонус получен: +${job.reward_points} очков` :
        alreadyClaimed ? "Этот бонус уже был получен." : "Время задания истекло.",
      show_alert: !result.success,
    });
    await telegramCall("editMessageCaption", {
      chat_id: chatId, message_id: messageId, caption: secretMissionCaption(job, state), parse_mode: "HTML",
      reply_markup: { inline_keyboard: [] },
    });
    return json({ ok: true });
  }

  if (action.startsWith("test:")) {
    const ownerId = Deno.env.get("TELEGRAM_PUBLIC_OWNER_ID") || "";
    const isOwner = ownerId !== "" && String(userId) === ownerId;
    if (!isOwner) {
      await telegramCall("answerCallbackQuery", {
        callback_query_id: callback.id,
        text: "Тестовая панель доступна только владельцу.",
        show_alert: true,
      });
      return json({ ok: true });
    }
    if (action === "test:none") {
      await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: "Выберите вариант стрелками" });
      return json({ ok: true });
    }
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    const match = action.match(/^test:preview:(chest|question|videos|winner|sponsor_chest|arcade_fly|arcade_snake):([0-9])$/);
    if (!match) return json({ ok: true, status: "ignored" });
    const kind = match[1] as DueNotification["kind"];
    const variant = Number(match[2]);
    const media = {
      type: "photo",
      media: notificationMedia(testNotificationItem(kind, variant), variant),
      caption: testNotificationText(map, kind, variant),
      parse_mode: "HTML",
    };
    if (Array.isArray(callback.message?.photo) && callback.message.photo.length > 0) {
      await telegramCall("editMessageMedia", {
        chat_id: chatId,
        message_id: messageId,
        media,
        reply_markup: testPreviewKeyboard(kind, variant),
      });
    } else {
      await telegramCall("sendPhoto", {
        chat_id: chatId,
        photo: media.media,
        caption: media.caption,
        parse_mode: "HTML",
        reply_markup: testPreviewKeyboard(kind, variant),
      });
      await telegramCall("deleteMessage", { chat_id: chatId, message_id: messageId });
    }
    return json({ ok: true });
  }

  if (action === "nav:help") {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    await editUiCard("help_safety", helpText(map), helpKeyboard(subscription));
    return json({ ok: true });
  }
  if (action === "nav:main") {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    await editUiCard(subscription ? "main_menu" : "welcome",
      subscription ? mainMenuText(map, subscription) : startText(map, false),
      subscription ? mainMenuKeyboard(subscription) : guestMenuKeyboard,
    );
    return json({ ok: true });
  }
  if (!subscription) {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: "Сначала подключите Telegram на сайте.", show_alert: true });
    return json({ ok: true });
  }
  const sendOracleResult = async (game: OracleGame) => {
    try {
      await telegramCall("sendPhoto", { chat_id: chatId, photo: game.cover_url, caption: oracleResultText(game), parse_mode: "HTML", reply_markup: oracleResultKeyboard(game) });
      await telegramCall("deleteMessage", { chat_id: chatId, message_id: messageId });
    } catch {
      await editMessage(oracleResultText(game), oracleResultKeyboard(game));
    }
  };
  const requestOracleResult = async (args: Record<string, unknown>) => {
    const { data, error } = await serviceClient().rpc("telegram_oracle_recommend_v2280", args);
    if (error) throw error;
    const result = data as { success?: boolean; status?: string; game?: OracleGame };
    if (result.success && result.game) await sendOracleResult(result.game);
    else await editMessage(
      "🎮 Оракул временно не смог открыть рекомендацию. Ответы сохранены — попробуйте ещё раз через несколько секунд.",
      { inline_keyboard: [[{ text: "🔄 Изменить ответы", callback_data: "oracle:start" }], [{ text: "⬅️ Главное меню", callback_data: "nav:main" }]] },
    );
  };
  if (action === "oracle:start") {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    await editOracleCard("intent", "*", oracleIntroText, oracleIntentKeyboard);
    return json({ ok: true });
  }
  const oracleIntent = action.match(/^oracle:i:(new|replay|coop|trust)$/);
  if (oracleIntent) {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    await editOracleCard("intent", oracleIntent[1], "🎮 <b>Сколько времени хотите провести в игре?</b>\n\nОракул учитывает не только полное прохождение, но и удобство коротких игровых сессий.", oracleTimeKeyboard(oracleIntent[1] as OracleIntent));
    return json({ ok: true });
  }
  const oracleTime = action.match(/^oracle:t:(new|replay|coop|trust):(evening|few_days|long)$/);
  if (oracleTime) {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    if (oracleTime[1] === "trust") {
      await editOracleCard("time", oracleTime[2], "🔮 <b>Какой знак сегодня зовёт сильнее?</b>\n\nНе пытайтесь угадать жанр. Выберите символ интуитивно — Оракул сам истолкует его.", oracleTrustSignKeyboard(oracleTime[2]));
    } else if (oracleTime[1] === "coop") {
      await editOracleCard("time", oracleTime[2], "🤝 <b>Как будете играть вместе?</b>\n\nМожно выбрать игру за одним устройством, сетевой кооператив или оставить оба варианта.", oracleCoopKeyboard(oracleTime[2]));
    } else {
      await editOracleCard("time", oracleTime[2], "🎮 <b>Какого настроения хочется от игры?</b>\n\nЦель поиска уже учтена — теперь выберите главное ощущение.", oracleMoodKeyboard(oracleTime[1], oracleTime[2], "any"));
    }
    return json({ ok: true });
  }
  const oracleTrustSign = action.match(/^oracle:s:(evening|few_days|long):(calm|spark|mystery)$/);
  if (oracleTrustSign) {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: "Знак принят. Оракул ищет игру…" });
    const calmMoods = ["relax", "story", "think"] as const;
    const sparkMoods = ["challenge", "surprise", "horror"] as const;
    const allMoods = [...calmMoods, ...sparkMoods] as const;
    const sign = oracleTrustSign[2];
    const moodPool = sign === "calm" ? calmMoods : sign === "spark" ? sparkMoods : allMoods;
    const discoveryPool = sign === "calm" ? (["safe", "gem"] as const)
      : sign === "spark" ? (["gem", "surprise"] as const)
      : (["safe", "gem", "surprise"] as const);
    const mood = moodPool[Math.floor(Math.random() * moodPool.length)];
    const discovery = discoveryPool[Math.floor(Math.random() * discoveryPool.length)];
    const avoidChoices = sign === "calm" ? ["stress", "reflex", "difficulty", "horror"]
      : sign === "spark" ? ["text", "grind", "early_access"]
      : [];
    if (Array.isArray(callback.message?.photo) && callback.message.photo.length > 0) {
      await editOracleCard("mood", mood, "✨ <b>Знак принят</b>\n\nОракул соединяет ваше время, прошлые реакции и выбранный символ.", { inline_keyboard: [] });
    }
    await requestOracleResult({
      p_telegram_user_id: userId,
      p_intent: "trust",
      p_time: oracleTrustSign[1],
      p_mood: null,
      p_avoid_choices: avoidChoices,
      p_discovery: discovery,
      p_coop_mode: "any",
    });
    return json({ ok: true });
  }
  const oracleCoop = action.match(/^oracle:c:(evening|few_days|long):(local|online|any)$/);
  if (oracleCoop) {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    await editOracleCard("coop", oracleCoop[2], "🎮 <b>Какого настроения хочется от игры?</b>\n\nОракул сначала соблюдёт формат совместной игры, а затем учтёт настроение.", oracleMoodKeyboard("coop", oracleCoop[1], oracleCoop[2]));
    return json({ ok: true });
  }
  const oracleMood = action.match(/^oracle:m:(new|replay|coop):(evening|few_days|long):(any|local|online):(relax|story|think|challenge|surprise|horror)$/);
  if (oracleMood) {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    await editOracleCard("mood", oracleMood[4], "🎮 <b>Чего сегодня точно не хочется?</b>\n\nМожно отметить сразу несколько пунктов. Оракул исключит игры с любой выбранной особенностью.", oracleAvoidKeyboard(oracleMood[1], oracleMood[2], oracleMood[3], oracleMood[4], 0));
    return json({ ok: true });
  }
  const oracleExclude = action.match(/^oracle:x:(new|replay|coop):(evening|few_days|long):(any|local|online):(relax|story|think|challenge|surprise|horror):(\d{1,3}):(0|1|2|3|4|5|6|reset|done)$/);
  if (oracleExclude) {
    const currentMask = Math.min(127, Number(oracleExclude[5]) || 0);
    if (oracleExclude[6] === "done") {
      await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
      await editOracleCard("filters", "all", "🎮 <b>Какую рекомендацию открыть?</b>\n\n🛡 Точная — известнее и максимально близка ответам.\n💎 Находка — менее очевидный качественный вариант.\n🎲 Смелая — шанс открыть что-то неожиданное.", oracleDiscoveryKeyboard(oracleExclude[1], oracleExclude[2], oracleExclude[3], oracleExclude[4], currentMask));
    } else {
      const nextMask = oracleExclude[6] === "reset" ? 0 : currentMask ^ (1 << Number(oracleExclude[6]));
      await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: nextMask ? "Фильтры обновлены" : "Ограничения сброшены" });
      await editOracleCard("filters", "all", "🎮 <b>Чего сегодня точно не хочется?</b>\n\nОтметьте любое количество пунктов и нажмите «Продолжить».", oracleAvoidKeyboard(oracleExclude[1], oracleExclude[2], oracleExclude[3], oracleExclude[4], nextMask));
    }
    return json({ ok: true });
  }
  const oraclePick = action.match(/^oracle:p:(new|replay|coop):(evening|few_days|long):(any|local|online):(relax|story|think|challenge|surprise|horror):(\d{1,3}):(safe|gem|surprise)$/);
  if (oraclePick || action === "oracle:next") {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: "Оракул подбирает игру…" });
    if (oraclePick && Array.isArray(callback.message?.photo) && callback.message.photo.length > 0) {
      const discoveryMediaKey = oraclePick[6] === "surprise" ? "bold" : oraclePick[6];
      await editOracleCard("discovery", discoveryMediaKey, "🔮 <b>Оракул открывает рекомендацию…</b>\n\nОтветы собраны. Осталось выбрать лучший из проверенных вариантов.", { inline_keyboard: [] });
    }
    const args = oraclePick ? {
      p_telegram_user_id: userId, p_intent: oraclePick[1], p_time: oraclePick[2], p_coop_mode: oraclePick[3], p_mood: oraclePick[4],
      p_avoid_choices: ORACLE_AVOIDS.filter((_value, index) => (Number(oraclePick[5]) & (1 << index)) !== 0), p_discovery: oraclePick[6],
    } : { p_telegram_user_id: userId, p_intent: null, p_time: null, p_mood: null, p_avoid_choices: null, p_discovery: null, p_coop_mode: null };
    await requestOracleResult(args);
    return json({ ok: true });
  }
  const oracleFeedback = action.match(/^oracle:f:(i|p|d):([0-9a-f-]{36})$/i);
  if (oracleFeedback) {
    if (oracleFeedback[1] === "d") {
      await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
      await editMessage("🎮 <b>Почему рекомендация не подошла?</b>\n\nОдин короткий ответ поможет Оракулу точнее подбирать следующие игры. Причина видна только системе и организатору.", oracleFeedbackReasonKeyboard(oracleFeedback[2]));
      return json({ ok: true });
    }
    const feedback = oracleFeedback[1] === "i" ? "interested" : "played";
    const { data, error } = await serviceClient().rpc("telegram_oracle_feedback_v2250", { p_telegram_user_id: userId, p_game_id: oracleFeedback[2], p_action: feedback, p_reason: "" });
    if (error) throw error;
    const ok = Boolean((data as { success?: boolean })?.success);
    const labels = { interested: "Запомнил: хотите попробовать 💜", played: "Запомнил: уже играли ✅" };
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: ok ? labels[feedback as keyof typeof labels] : "Не удалось сохранить ответ.", show_alert: !ok });
    return json({ ok: true });
  }
  const oracleReason = action.match(/^oracle:r:(already_played|genre|too_hard|too_scary|too_long|early_access|no_russian|visual_style|not_interested):([0-9a-f-]{36})$/i);
  if (oracleReason) {
    const { data, error } = await serviceClient().rpc("telegram_oracle_feedback_v2250", { p_telegram_user_id: userId, p_game_id: oracleReason[2], p_action: "disliked", p_reason: oracleReason[1] });
    if (error) throw error;
    const result = data as { success?: boolean; reaction?: string };
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: result.success ? "Спасибо, Оракул учтёт причину" : "Не удалось сохранить ответ.", show_alert: !result.success });
    if (result.success) await editMessage(
      result.reaction === "played" ? "✅ <b>Отметил игру как пройденную</b>\n\nОна сможет вернуться только в специальной подборке для перепрохождения." : "💜 <b>Причина сохранена</b>\n\nОракул не будет снова предлагать эту игру и точнее оценит следующие варианты.",
      { inline_keyboard: [[{ text: "🎲 Другой вариант", callback_data: "oracle:next" }], [{ text: "🔄 Новый подбор", callback_data: "oracle:start" }, { text: "⬅️ Меню", callback_data: "nav:main" }]] },
    );
    return json({ ok: true });
  }
  if(action==="support:start"){await telegramCall("answerCallbackQuery",{callback_query_id:callback.id});await editUiCard("support_topics",supportStartText,supportCategoriesKeyboard);return json({ok:true});}
  if(action==="support:cancel"){await serviceClient().from("giveaway_telegram_support_drafts").delete().eq("subscription_id",subscription.id);await telegramCall("answerCallbackQuery",{callback_query_id:callback.id,text:"Обращение отменено"});await editUiCard("help_safety",helpText(map),helpKeyboard(subscription));return json({ok:true});}
  if(action.startsWith("support:category:")){
    const category=action.slice("support:category:".length); const allowed=["email_confirmation","application","points","video","chest","question","telegram","site","other"];
    if(!allowed.includes(category)) return json({ok:true,status:"ignored"});
    const {error}=await serviceClient().from("giveaway_telegram_support_drafts").upsert({subscription_id:subscription.id,category,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+30*60_000).toISOString()}); if(error) throw error;
    await telegramCall("answerCallbackQuery",{callback_query_id:callback.id,text:"Тема выбрана"});
    await editUiCard("support_details",["🛟 <b>Опишите проблему</b>","","Одним сообщением напишите, что делали, что произошло и чего ожидали.","Минимум 20 символов · форма действует 30 минут."].join("\n"),supportCancelKeyboard); return json({ok:true});
  }
  if (action.startsWith("quiet:")) {
    if (action === "quiet:none") {
      await telegramCall("answerCallbackQuery", {
        callback_query_id: callback.id,
        text: `Местное время: ${formatClock(currentLocalMinutes(subscription.timezone_offset_minutes))}`,
      });
      return json({ ok: true });
    }
    if (action === "quiet:menu") {
      await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
      await editUiCard("quiet_hours", quietSettingsText(map, subscription), quietSettingsKeyboard(subscription));
      return json({ ok: true });
    }

    const patch: Partial<Subscription> & { updated_at?: string } = { updated_at: new Date().toISOString() };
    if (action === "quiet:toggle") {
      patch.quiet_hours_enabled = !subscription.quiet_hours_enabled;
    } else {
      const match = action.match(/^quiet:(tz|start|end):(-?[0-9]{1,3})$/);
      if (!match) return json({ ok: true, status: "ignored" });
      const delta = Number(match[2]);
      if (match[1] === "tz") patch.timezone_offset_minutes = normalizeOffsetMinutes(subscription.timezone_offset_minutes + delta);
      if (match[1] === "start") patch.quiet_start_minutes = normalizeDayMinutes(subscription.quiet_start_minutes + delta);
      if (match[1] === "end") patch.quiet_end_minutes = normalizeDayMinutes(subscription.quiet_end_minutes + delta);
      const nextStart = Number(patch.quiet_start_minutes ?? subscription.quiet_start_minutes);
      const nextEnd = Number(patch.quiet_end_minutes ?? subscription.quiet_end_minutes);
      if (nextStart === nextEnd) {
        await telegramCall("answerCallbackQuery", {
          callback_query_id: callback.id,
          text: "Начало и конец тихих часов должны отличаться.",
          show_alert: true,
        });
        return json({ ok: true });
      }
    }
    const { error } = await serviceClient().from("giveaway_telegram_subscriptions")
      .update(patch).eq("id", subscription.id);
    if (error) throw error;
    subscription = { ...subscription, ...patch } as Subscription;
    await telegramCall("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: action === "quiet:toggle"
        ? (subscription.quiet_hours_enabled ? "Тихие часы включены" : "Тихие часы выключены")
        : "Настройка сохранена",
    });
    await editUiCard("quiet_hours", quietSettingsText(map, subscription), quietSettingsKeyboard(subscription));
    return json({ ok: true });
  }
  if (action === "nav:settings") {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    await editUiCard("settings", settingsText(map, subscription), settingsKeyboard(subscription));
    return json({ ok: true });
  }
  if (action === "nav:status") {
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id });
    await editUiCard("connection_status", statusText(map, subscription), helpKeyboard(subscription));
    return json({ ok: true });
  }
  if (action === "nav:active") {
    const next = !subscription.active;
    const { error } = await serviceClient().from("giveaway_telegram_subscriptions")
      .update({ active: next, updated_at: new Date().toISOString(), blocked_at: null, last_error: null })
      .eq("id", subscription.id);
    if (error) throw error;
    subscription = { ...subscription, active: next };
    await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: next ? "Уведомления включены" : "Уведомления приостановлены" });
    await editUiCard("help_safety", helpText(map), helpKeyboard(subscription));
    return json({ ok: true });
  }

  const key = action.replace(/^pref:/, "");
  const columns: Record<string, keyof Subscription> = {
    chest: "notify_chest", sponsor_chest: "notify_sponsor_chest", arcade: "notify_arcade", question: "notify_question", videos: "notify_videos",
    winner: "notify_winner", secret_missions: "notify_secret_missions", active: "active",
  };
  const column = columns[key];
  if (!column) return json({ ok: true, status: "ignored" });
  const next = !Boolean(subscription[column]);
  const { error } = await serviceClient().from("giveaway_telegram_subscriptions")
    .update({ [column]: next, updated_at: new Date().toISOString(), blocked_at: null, last_error: null })
    .eq("id", subscription.id);
  if (error) throw error;
  const updated = { ...subscription, [column]: next } as Subscription;
  await telegramCall("answerCallbackQuery", { callback_query_id: callback.id, text: "Настройка сохранена" });
  await editUiCard("settings", settingsText(map, updated), settingsKeyboard(updated));
  return json({ ok: true });
};

Deno.serve(async (request) => {
  if (request.method === "GET") return json({ ok: true, service: "telegram-public-bot", version: "2.33.0" });
  if (request.method !== "POST") return json({ ok: false, status: "method_not_allowed" }, 405);

  const cronSecret = Deno.env.get("TELEGRAM_PUBLIC_CRON_SECRET") || "";
  const authorization = request.headers.get("authorization") || "";
  if (cronSecret && authorization === `Bearer ${cronSecret}`) {
    const cronPayload = await request.json().catch(() => ({})) as { action?: string };
    if (cronPayload.action === "health") {
      return json({ ok: true, scheduler_auth: true, version: "2.33.0" });
    }
    if (cronPayload.action !== "run_notifications") {
      return json({ ok: false, status: "unknown_scheduler_action" }, 400);
    }
    const service = serviceClient();
    await service.rpc("telegram_scheduler_begin_v2292");
    try {
      const [notifications, secretMissions, support, announcements] = await Promise.all([
        runNotifications(), runSecretMissions(), runSupportDeliveries(), runAnnouncements(),
      ]);
      const result = { notifications, secret_missions: secretMissions, support, announcements };
      await service.rpc("telegram_scheduler_finish_v2292", {
        p_success: true, p_result: result, p_error: null,
      });
      return json({ ok: true, ...result });
    }
    catch (error) {
      console.error("telegram-public-bot cron", error);
      await service.rpc("telegram_scheduler_finish_v2292", {
        p_success: false, p_result: {}, p_error: String((error as Error)?.message || error).slice(0, 450),
      }).catch(() => null);
      return json({ ok: false, status: "notification_run_failed" }, 500);
    }
  }

  const expectedSecret = Deno.env.get("TELEGRAM_PUBLIC_WEBHOOK_SECRET") || "";
  const suppliedSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!expectedSecret || suppliedSecret !== expectedSecret) return json({ ok: false, status: "forbidden" }, 403);

  const update = await request.json().catch(() => null) as TelegramUpdate | null;
  if (!update || !Number.isInteger(update.update_id)) return json({ ok: true, status: "ignored" });
  const map = loadEmojiMap();

  try {
    if (update.callback_query) return await handleCallback(update.callback_query, map);
    const message = update.message || update.edited_message;
    if (!message?.chat?.id || !message.from?.id || message.chat.type !== "private") {
      return json({ ok: true, status: "ignored" });
    }
    const text = String(message.text || "").trim();
    const command = text.split(/\s+/, 1)[0].toLowerCase().replace(/@rytni_give_bot$/, "");
    const ownerId = Deno.env.get("TELEGRAM_PUBLIC_OWNER_ID") || "";
    const isOwner = ownerId !== "" && String(message.from.id) === ownerId;

    if (command === "/start") {
      const token = parseStartToken(text);
      let subscription: Subscription | null = null;
      if (token === "settings") {
        subscription = await loadSubscription(message.from.id);
        if (!subscription) return telegramReply(message, `Telegram ещё не привязан. <a href="${SITE_URL}">Откройте личную комнату</a> и нажмите «Подключить Telegram».`, hideReplyKeyboard);
        return telegramPhotoReply(message, UI_MEDIA.settings || "", settingsText(map, subscription), settingsKeyboard(subscription));
      } else if (token) {
        const result = await claimLink(message, token);
        if (result?.success !== true) return telegramReply(message, `Ссылка подключения устарела или уже использована. <a href="${SITE_URL}">Создайте новую</a> в личной комнате на сайте.`, hideReplyKeyboard);
        subscription = await loadSubscription(message.from.id);
      } else subscription = await loadSubscription(message.from.id);
      return telegramPhotoReply(
        message,
        UI_MEDIA[subscription ? "main_menu" : "welcome"] || "",
        subscription ? mainMenuText(map, subscription) : startText(map, false),
        subscription ? mainMenuKeyboard(subscription) : guestMenuKeyboard,
      );
    }
    if (command === "/settings") {
      const subscription = await loadSubscription(message.from.id);
      if (!subscription) return telegramReply(message, `Telegram ещё не привязан. <a href="${SITE_URL}">Откройте личную комнату</a> на сайте и нажмите «Подключить Telegram».`, hideReplyKeyboard);
      return telegramPhotoReply(message, UI_MEDIA.settings || "", settingsText(map, subscription), settingsKeyboard(subscription));
    }
    if (command === "/status") {
      const subscription = await loadSubscription(message.from.id);
      if (!subscription) return telegramReply(message, `Подключение не найдено. <a href="${SITE_URL}">Подключите Telegram</a> из личной комнаты на сайте.`, hideReplyKeyboard);
      return telegramPhotoReply(message, UI_MEDIA.connection_status || "", statusText(map, subscription), helpKeyboard(subscription));
    }
    if (command === "/stop") {
      await serviceClient().from("giveaway_telegram_subscriptions").update({ active: false, updated_at: new Date().toISOString() }).eq("telegram_user_id", message.from.id);
      const subscription = await loadSubscription(message.from.id);
      if (!subscription) return telegramReply(message, `Подключение не найдено. <a href="${SITE_URL}">Подключите Telegram</a> на сайте.`, hideReplyKeyboard);
      return telegramPhotoReply(message, UI_MEDIA.help_safety || "", helpText(map), helpKeyboard(subscription));
    }
    if (command === "/resume") {
      await serviceClient().from("giveaway_telegram_subscriptions").update({ active: true, updated_at: new Date().toISOString(), blocked_at: null, last_error: null }).eq("telegram_user_id", message.from.id);
      const subscription = await loadSubscription(message.from.id);
      if (!subscription) return telegramReply(message, `Подключение не найдено. <a href="${SITE_URL}">Подключите Telegram</a> на сайте.`, hideReplyKeyboard);
      return telegramPhotoReply(message, UI_MEDIA.help_safety || "", helpText(map), helpKeyboard(subscription));
    }
    if (command === "/unlink") {
      await serviceClient().from("giveaway_telegram_subscriptions").delete().eq("telegram_user_id", message.from.id);
      return telegramReply(message, `Telegram отвязан от аккаунта Rytni. <a href="${SITE_URL}">Подключить его снова</a> можно в личной комнате на сайте.`, hideReplyKeyboard);
    }
    if (command === "/help") {
      const subscription = await loadSubscription(message.from.id);
      return telegramPhotoReply(message, UI_MEDIA.help_safety || "", helpText(map), helpKeyboard(subscription));
    }
    if (command === "/site") return telegramReply(message, "🎮 <b>Личная комната Rytni Подари</b>\n\nОткройте сайт, чтобы проверить заявку и продолжить прокачку.", siteButton);
    if (command === "/test_notifications" && isOwner) {
      return telegramReply(message, testMenuText, testMenuKeyboard);
    }
    if (command === "/emoji_test" && isOwner) {
      const line = REQUIRED_EMOJI_KEYS.map((key) => emoji(map, key, "✨")).join(" ");
      return telegramReply(message, `${line}\n\n<b>Премиум-эмодзи:</b> ${Object.keys(map).length}/${REQUIRED_EMOJI_KEYS.length}`);
    }
    if (command === "/run_notifications" && isOwner) {
      const [result, missions] = await Promise.all([runNotifications(), runSecretMissions()]);
      return telegramReply(message, `Проверка завершена: обычных отправлено ${result.sent}, секретных заданий ${missions.offered}, истекло ${missions.expired}, ошибок ${result.failed + missions.failed}.`);
    }
    const subscription = await loadSubscription(message.from.id);
    if(subscription&&!text.startsWith("/")){
      const announcementDraft=await loadAnnouncementQuestionDraft(subscription.id);
      if(announcementDraft){
        if(text.length<10||text.length>500){
          await deleteTelegramMessage(message.chat.id,message.message_id);
          await deleteTelegramMessage(message.chat.id,announcementDraft.prompt_message_id);
          await deleteTelegramMessage(message.chat.id,announcementDraft.validation_message_id);
          const validationText=text.length<10
            ? "📝 <b>Нужно немного подробнее</b>\n\nСообщение слишком короткое. Добавьте деталей и отправьте вопрос ещё раз.\n\nМинимум — 10 символов."
            : "✂️ <b>Сделаем вопрос короче</b>\n\nСообщение слишком длинное. Сократите его и отправьте ещё раз.\n\nМаксимум — 500 символов.";
          const validationResult=await sendAnnouncementQuestionCard(
            message.chat.id,
            text.length<10?"too_short":"too_long",
            validationText,
            announcementQuestionKeyboard(announcementDraft.delivery_id),
          );
          const validationMessageId=Number(validationResult?.result?.message_id||0);
          if(validationMessageId) await serviceClient().from("giveaway_telegram_announcement_question_drafts")
            .update({prompt_message_id:null,validation_message_id:validationMessageId}).eq("subscription_id",subscription.id);
          return json({ok:true});
        }
        const {data,error}=await serviceClient().rpc("telegram_submit_announcement_question_v2310",{
          p_telegram_user_id:message.from.id,p_question:text,
        });
        if(error) throw error;
        const result=data as {success?:boolean;status?:string;delivery_id?:string;telegram_message_id?:number;reward_points?:number;accepted?:boolean};
        if(result.success===true){
          await deleteTelegramMessage(message.chat.id,announcementDraft.prompt_message_id);
          await deleteTelegramMessage(message.chat.id,announcementDraft.validation_message_id);
          await deleteTelegramMessage(message.chat.id,message.message_id);
          if(result.telegram_message_id) await telegramCall("editMessageReplyMarkup",{
            chat_id:message.chat.id,message_id:result.telegram_message_id,
            reply_markup:announcementKeyboard(String(result.delivery_id||announcementDraft.delivery_id),Number(result.reward_points||0),true,Boolean(result.accepted),true),
          }).catch(()=>null);
          await sendAnnouncementQuestionCard(
            message.chat.id,
            "question_sent",
            "✅ <b>Вопрос отправлен Rytni</b>\n\nСпасибо! Если вопрос окажется особенно интересным, он может попасть в будущее видео.",
          );
          return json({ok:true});
        }
        if(result.status==="invalid_length") return telegramReply(message,"Длина вопроса должна быть от 10 до 500 символов. Исправьте сообщение и попробуйте ещё раз.");
        if(result.status==="already_submitted") return telegramReply(message,"Вы уже отправили вопрос к этому объявлению.");
        return telegramReply(message,"Приём вопросов к этому объявлению уже завершён.");
      }
      const draft=await loadSupportDraft(subscription.id);
      if(draft){
        if(text.length<20||text.length>2000) return telegramReply(message,"Описание должно содержать от 20 до 2000 символов. Дополните его и отправьте ещё раз.",supportCancelKeyboard);
        const result=await createSupportTicket(message.from.id,draft.category,text);
        if(result.success===true) return telegramReply(message,"✅ <b>Обращение отправлено</b>\n\nМы проверим ваш случай. Результат и ответ придут в этот чат.",mainMenuKeyboard(subscription));
        if(result.status==="rate_limited") return telegramReply(message,"Слишком много обращений за короткое время. Попробуйте позже.",mainMenuKeyboard(subscription));
        return telegramReply(message,"Не удалось отправить обращение. Откройте поддержку в главном меню и попробуйте ещё раз.",mainMenuKeyboard(subscription));
      }
    }
    return telegramReply(
      message,
      subscription ? mainMenuText(map, subscription) : startText(map, false),
      subscription ? mainMenuKeyboard(subscription) : guestMenuKeyboard,
    );
  } catch (error) {
    console.error("telegram-public-bot webhook", error);
    const message = update.message || update.edited_message;
    if (message?.chat?.id) return telegramReply(message, "Не удалось выполнить команду. Попробуйте ещё раз немного позже.");
    return json({ ok: false, status: "handler_failed" }, 500);
  }
});
