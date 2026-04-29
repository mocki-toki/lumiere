# Bot Matrix Buttons v1 (Public Spec)

This document defines the Lumiere inline button protocol for Matrix bots.

## Scope
- Producer: any bot that sends Matrix events.
- Consumer: Lumiere client.
- Callback transport: Matrix event `io.lumiere.bot.callback`.

## Message Event Schema (Bot -> Room)
Buttons are attached to a normal room message event via a custom content field.

```json
{
  "type": "m.room.message",
  "content": {
    "msgtype": "m.text",
    "body": "Choose an action",
    "io.lumiere.bot.reply_markup": {
      "inline_keyboard": [
        [
          { "text": "Done", "callback_data": "todo:done:42" },
          { "text": "Delete", "callback_data": "todo:delete:42" }
        ]
      ]
    }
  }
}
```

### Field Contract
- `io.lumiere.bot.reply_markup`: object.
- `inline_keyboard`: array of rows.
- Each row: array of button objects.
- Rendering semantics:
  - each row is rendered as a separate line under the message;
  - buttons inside a row are rendered as columns in that line.
- Button:
  - `text`: string label shown to user.
  - `callback_data`: opaque string payload returned to bot runtime.

Buttons with empty/invalid `text` or `callback_data` are ignored by the client.

## Callback Event Schema (User -> Room)
When a user clicks a button, Lumiere sends one callback event:

```json
{
  "type": "io.lumiere.bot.callback",
  "content": {
    "callback_data": "todo:done:42",
    "m.relates_to": {
      "event_id": "$target_message_event_id"
    }
  }
}
```

### Callback Payload Contract
- `callback_data`: required string copied from clicked button.
- `m.relates_to.event_id`: required string; Matrix event ID of the bot message that rendered the button.

## Telegram Parity Mapping
- Telegram `InlineKeyboardMarkup.inline_keyboard` -> Matrix `io.lumiere.bot.reply_markup.inline_keyboard`.
- Telegram `InlineKeyboardButton.text` -> Matrix button `text`.
- Telegram `InlineKeyboardButton.callback_data` -> Matrix button `callback_data`.
- Telegram callback query reference (`message_id`) -> Matrix `m.relates_to.event_id`.

## Client Behavior and Visibility
- Buttons render under supported message events when `reply_markup` is present.
- While a callback is pending for a specific target message, buttons for that message are disabled.
- Repeated rapid clicks on the same target message are deduplicated client-side until the pending callback settles.
- Callback events are treated as technical events:
  - Hidden when `showHiddenEvents = false`.
  - Visible in timeline when `showHiddenEvents = true`.

## Known Limitation (This Release)
- Non-Lumiere/manual fallback is not provided in v1.
- Command emulation fallback is out of scope for this release.
