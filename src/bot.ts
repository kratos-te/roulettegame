import { Bot, InlineKeyboard, webhookCallback, Context } from "grammy";
import { chunk } from "lodash";
import express from "express";
import { applyTextEffect, Variant } from "./textEffects";

import type { Variant as TextEffectVariant } from "./textEffects";

// Create a bot using the Telegram token
const bot = new Bot("6228945480:AAFpciTQ2lolZnEJtxk2DSMPiO-9ue2o8zY" || "");

// Handle the /yo command to greet the user
bot.command("yo", (ctx) => ctx.reply(`Yo ${ctx.from?.username}`));

// Handle the /effect command to apply text effects using an inline keyboard
type Effect = { code: TextEffectVariant; label: string };
const allEffects: Effect[] = [
  {
    code: "w",
    label: "Monospace",
  },
  {
    code: "b",
    label: "Bold",
  },
  {
    code: "i",
    label: "Italic",
  },
  {
    code: "d",
    label: "Doublestruck",
  },
  {
    code: "o",
    label: "Circled",
  },
  {
    code: "q",
    label: "Squared",
  },
];

const effectCallbackCodeAccessor = (effectCode: TextEffectVariant) =>
  `effect-${effectCode}`;

const effectsKeyboardAccessor = (effectCodes: string[]) => {
  const effectsAccessor = (effectCodes: string[]) =>
    effectCodes.map((code) =>
      allEffects.find((effect) => effect.code === code)
    );
  const effects = effectsAccessor(effectCodes);

  const keyboard = new InlineKeyboard();
  const chunkedEffects = chunk(effects, 3);
  for (const effectsChunk of chunkedEffects) {
    for (const effect of effectsChunk) {
      effect &&
        keyboard.text(effect.label, effectCallbackCodeAccessor(effect.code));
    }
    keyboard.row();
  }

  return keyboard;
};

const textEffectResponseAccessor = (
  originalText: string,
  modifiedText?: string
) =>
  `Original: ${originalText}` +
  (modifiedText ? `\nModified: ${modifiedText}` : "");

const parseTextEffectResponse = (
  response: string
): {
  originalText: string;
  modifiedText?: string;
} => {
  const originalText = (response.match(/Original: (.*)/) as any)[1];
  const modifiedTextMatch = response.match(/Modified: (.*)/);

  let modifiedText;
  if (modifiedTextMatch) modifiedText = modifiedTextMatch[1];

  if (!modifiedTextMatch) return { originalText };
  else return { originalText, modifiedText };
};

bot.command("effect", (ctx) =>
  ctx.reply(textEffectResponseAccessor(ctx.match), {
    reply_markup: effectsKeyboardAccessor(
      allEffects.map((effect) => effect.code)
    ),
  })
);

// Handle inline queries
const queryRegEx = /effect (monospace|bold|italic) (.*)/;
bot.inlineQuery(queryRegEx, async (ctx) => {
  const fullQuery = ctx.inlineQuery.query;
  const fullQueryMatch = fullQuery.match(queryRegEx);
  if (!fullQueryMatch) return;

  const effectLabel = fullQueryMatch[1];
  const originalText = fullQueryMatch[2];

  const effectCode = allEffects.find(
    (effect) => effect.label.toLowerCase() === effectLabel.toLowerCase()
  )?.code;
  const modifiedText = applyTextEffect(originalText, effectCode as Variant);

  await ctx.answerInlineQuery(
    [
      {
        type: "article",
        id: "text-effect",
        title: "Text Effects",
        input_message_content: {
          message_text: `Original: ${originalText}
Modified: ${modifiedText}`,
          parse_mode: "HTML",
        },
        reply_markup: new InlineKeyboard().switchInline("Share", fullQuery),
        url: "http://t.me/EludaDevSmarterBot",
        description: "Create stylish Unicode text, all within Telegram.",
      },
    ],
    { cache_time: 30 * 24 * 3600 } // one month in seconds
  );
});

// Return empty result list for other queries.
bot.on("inline_query", (ctx) => ctx.answerInlineQuery([]));

// Handle text effects from the effect keyboard
for (const effect of allEffects) {
  const allEffectCodes = allEffects.map((effect) => effect.code);

  bot.callbackQuery(effectCallbackCodeAccessor(effect.code), async (ctx) => {
    const { originalText } = parseTextEffectResponse(ctx.msg?.text || "");
    const modifiedText = applyTextEffect(originalText, effect.code);

    await ctx.editMessageText(
      textEffectResponseAccessor(originalText, modifiedText),
      {
        reply_markup: effectsKeyboardAccessor(
          allEffectCodes.filter((code) => code !== effect.code)
        ),
      }
    );
  });
}

// Handle the /about command
const aboutUrlKeyboard = new InlineKeyboard().url(
  "Host your own bot for free.",
  "https://cyclic.sh/"
);

// Suggest commands in the menu
bot.api.setMyCommands([
  { command: "yo", description: "Be greeted by the bot" },
  {
    command: "effect",
    description: "make text effects on the text. (usage: /effect [text])",
  },
  {
    command: "revolver",
    description: "Create Game",
  },
]);

// Handle all other messages and the /start command
// const introductionMessage = `Hello! I'm a Telegram bot.
// I'm powered by Cyclic, the next-generation serverless computing platform.

// <b>Commands</b>
// /yo - Be greeted by me
// /effect [text] - Show a keyboard to apply text effects to [text]`;

const introductionMessage = `Welcome to "Dynamite" Game.`;
const newGameMsg = `New Game Create
Cost: $10
Max player: 10
Losers: 3`;

const replyWithIntro = (ctx: any) =>
  ctx.reply(introductionMessage, {
    reply_markup: aboutUrlKeyboard,
    parse_mode: "HTML",
  });

bot.command("start", replyWithIntro);
// bot.on("message", replyWithIntro);

//Handle start battle with text

const joinGameBtn = new InlineKeyboard().text("Join Game");

const buttons = [
  [
    { text: "Pull Trigger", callback_data: "button1" },
    { text: "Pass", callback_data: "button2" },
    { text: "Spin Chamber", callback_data: "button3" },
  ],
];

// bot.command("revolver", async (ctx) => {
//   const reply = await ctx.reply("Input Cost");

//   const countdownSeconds = 60;

//   let remainingSeconds = countdownSeconds;
//   const replyMessage = await ctx.reply("Hello, Created Game", {
//     reply_markup: joinGameBtn,
//   });

//   const countdownInterval = setInterval(() => {
//     remainingSeconds--;
//     if (remainingSeconds > 0) {
//       bot.api.editMessageText(
//         ctx.chat.id,
//         replyMessage.message_id,
//         `Hello, Created Game\nGame Starts in ${remainingSeconds} seconds`,
//         {
//           reply_markup: joinGameBtn,
//         }
//       );
//     } else {
//       clearInterval(countdownInterval);
//       bot.api.editMessageText(
//         ctx.chat.id,
//         replyMessage.message_id,
//         `Game Over!`,
//         {
//           reply_markup: { inline_keyboard: buttons },
//         }
//       );
//     }
//   }, 1000);
// });

bot.on("message", async (ctx) => {
  const countdownSeconds = 60;

  let remainingSeconds = countdownSeconds;
  const replyMessage = await ctx.reply("Hello, Created Game", {
    reply_markup: joinGameBtn,
  });

  const countdownInterval = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds > 0) {
      bot.api.editMessageText(
        ctx.chat.id,
        replyMessage.message_id,
        `${newGameMsg} 
        Starts in ${remainingSeconds}s...
        Joined Player ${ctx.from?.username}`,
        {
          reply_markup: joinGameBtn,
        }
      );
    } else {
      clearInterval(countdownInterval);
      bot.api.editMessageText(
        ctx.chat.id,
        replyMessage.message_id,
        `Playing Game
        Cost: 10$
        Players:
        `,
        {
          reply_markup: { inline_keyboard: buttons },
        }
      );
    }
  }, 1000);
});

bot.on("callback_query", async (ctx) => {
  const buttonClicked = ctx.callbackQuery?.data;

  if (buttonClicked === "button1") {
    await ctx.answerCallbackQuery("Clicked 'Pull Trigger'");
  } else if (buttonClicked === "button2") {
    await ctx.answerCallbackQuery("Clicked 'Pass'");
  } else if (buttonClicked === "button3") {
    await ctx.answerCallbackQuery("Clicked 'Spin Chamber'");
  }
});

// Start the server
if (process.env.NODE_ENV === "production") {
  // Use Webhooks for the production server
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  // Use Long Polling for development
  bot.start();
}
