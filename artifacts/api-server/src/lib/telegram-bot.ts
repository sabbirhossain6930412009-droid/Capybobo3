import { createHmac, timingSafeEqual } from "node:crypto";
import { logger } from "./logger";

type TelegramMessage = {
  chat: {
    id: number;
    type: string;
  };
  from?: {
    is_bot?: boolean;
  };
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

type TelegramApiResponse = {
  ok: boolean;
};

const webhookPath = "/api/telegram/webhook";

function getMiniAppUrl(): string | null {
  const configuredUrl = process.env.TELEGRAM_MINI_APP_URL?.trim();
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  const candidate = configuredUrl || (domain ? `https://${domain}` : "");

  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !url.hostname) {
      return null;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getTelegramWebhookSecret(botToken: string): string {
  return createHmac("sha256", botToken)
    .update("capyboo3-telegram-webhook")
    .digest("base64url");
}

export function matchesTelegramWebhookSecret(
  botToken: string,
  providedSecret: string | undefined,
): boolean {
  if (!providedSecret) {
    return false;
  }

  const expected = Buffer.from(getTelegramWebhookSecret(botToken), "utf8");
  const provided = Buffer.from(providedSecret, "utf8");
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

function isTelegramUpdate(value: unknown): value is TelegramUpdate {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = (value as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const chat = (message as { chat?: unknown }).chat;
  return (
    typeof chat === "object" &&
    chat !== null &&
    typeof (chat as { id?: unknown }).id === "number" &&
    typeof (chat as { type?: unknown }).type === "string"
  );
}

async function sendMessage(
  botToken: string,
  chatId: number,
  text: string,
  miniAppUrl: string,
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open Capyboo3",
                web_app: { url: miniAppUrl },
              },
            ],
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Telegram sendMessage request failed.");
  }

  const result = (await response.json()) as TelegramApiResponse;
  if (result.ok !== true) {
    throw new Error("Telegram rejected the sendMessage request.");
  }
}

export async function handleTelegramUpdate(
  botToken: string,
  value: unknown,
): Promise<void> {
  if (!isTelegramUpdate(value)) {
    return;
  }

  const message = value.message;
  if (
    !message ||
    !message.text ||
    message.from?.is_bot ||
    message.chat.type !== "private"
  ) {
    return;
  }

  const miniAppUrl = getMiniAppUrl();
  if (!miniAppUrl) {
    throw new Error("Telegram Mini App URL is not configured.");
  }

  const command = message.text.trim().split(/\s+/, 1)[0]?.split("@", 1)[0];
  const text =
    command?.toLowerCase() === "/start"
      ? "Welcome to Capyboo3! Tap below to open the Mini App."
      : "Tap below to open Capyboo3.";

  await sendMessage(botToken, message.chat.id, text, miniAppUrl);
}

export async function configureTelegramWebhook(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    logger.info("Telegram webhook setup skipped outside production");
    return;
  }

  const botToken = process.env.BOT_TOKEN?.trim();
  if (!botToken) {
    logger.warn("Telegram webhook setup skipped because BOT_TOKEN is missing");
    return;
  }

  const miniAppUrl = getMiniAppUrl();
  if (!miniAppUrl) {
    logger.warn(
      "Telegram webhook setup skipped because no public HTTPS Mini App URL is configured",
    );
    return;
  }

  const webhookUrl = new URL(webhookPath, miniAppUrl).toString();
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: getTelegramWebhookSecret(botToken),
        allowed_updates: ["message"],
        max_connections: 1,
      }),
    },
  );

  if (!response.ok) {
    logger.warn(
      { statusCode: response.status },
      "Telegram webhook registration failed",
    );
    return;
  }

  const result = (await response.json()) as TelegramApiResponse;
  if (result.ok !== true) {
    logger.warn("Telegram rejected webhook registration");
    return;
  }

  logger.info("Telegram webhook registered");
}
