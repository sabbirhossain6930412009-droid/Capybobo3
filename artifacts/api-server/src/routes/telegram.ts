import { Router, type IRouter } from "express";
import {
  handleTelegramUpdate,
  matchesTelegramWebhookSecret,
} from "../lib/telegram-bot";

const router: IRouter = Router();

router.post("/telegram/webhook", async (req, res): Promise<void> => {
  const botToken = process.env.BOT_TOKEN?.trim();
  if (!botToken) {
    res.sendStatus(503);
    return;
  }

  if (
    !matchesTelegramWebhookSecret(
      botToken,
      req.get("x-telegram-bot-api-secret-token"),
    )
  ) {
    res.sendStatus(403);
    return;
  }

  try {
    await handleTelegramUpdate(botToken, req.body);
    res.sendStatus(200);
  } catch {
    req.log.error("Telegram update could not be answered");
    res.sendStatus(502);
  }
});

export default router;
