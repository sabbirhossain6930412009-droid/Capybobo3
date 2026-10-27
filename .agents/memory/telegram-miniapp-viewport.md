---
name: Telegram Mini App viewport
description: Replit preview screenshots can include Telegram host chrome outside the embedded app viewport.
---

In the Replit Telegram Web App preview, gray bands above and below the page may be Telegram host chrome, not the Mini App body. The Telegram-reported viewport is shorter than the full screenshot, so preserve the portrait artwork within that app viewport rather than stretching it to the screenshot dimensions.

**Why:** Sizing to the outer screenshot can distort or crop the artwork while trying to fill space that the Mini App does not own.

**How to apply:** When checking the Telegram Mini App preview, size content using Telegram's viewport values and treat outer screenshot bands as host UI.
