const { Telegraf } = require('telegraf');
const ytdl = require('ytdl-core');
const fs = require('fs');

// Telegram bot tokenini va kanal IDni quyidagi joyga yozing
const botToken = '6850928323:AAFXH_nuhB_FTVS1qjRLfQSxLfiafoYwYJY';
const channelId = '@Oltinmusiqauz';
const adminId = '5541882812'; // Adminning user IDsi


// Botni yaratish
const bot = new Telegraf(botToken);

// Statistika saqlash uchun ma'lumotlar
let users = [];  // Foydalanuvchilar ro'yxati
let lastStatsSent = 0;

// /start komandasi uchun
bot.start((ctx) => {
  const userId = ctx.from.id;
  const { first_name, last_name, username } = ctx.from;

  const welcomeMessage = `Salom, *${first_name} ${last_name}* (@${username})! YouTube havolani yuboring, audio yuklash uchun tayyorman.`;
  
  // Markdown orqali talqinli matnni yuborish
  ctx.replyWithMarkdown(welcomeMessage);
  
  // Foydalanuvchini ro'yxatga qo'shish
  if (!users.some((user) => user.id === userId)) {
    users.push({
      id: userId,
      first_name,
      last_name,
      username,
    });
  }
});

// Statistika uchun funksiya
function getStats(mediaType, mediaTitle) {
  const userList = users.map((user) => `@${user.username}`).join(', ');

  return `
    Umumiy foydalanuvchilar soni: ${users.length}
    Foydalanuvchilar ro'yxati: ${userList}
    Telegram kanalga yuborilgan sanasi va vaqti: ${new Date().toLocaleString()}
    Yuborilgan ${mediaType}: ${mediaTitle}
  `;
}

// Har 40 sekundda bir statistikani yuborish
setInterval(() => {
  const now = Date.now();
  if (now - lastStatsSent >= 40000) {
    lastStatsSent = now;

    // Statistikani yuborish
    const stats = getStats('media_type', 'media_title'); // Yuborilgan media turi va nomi
    bot.telegram.sendMessage(channelId, stats);
  }
}, 1000);

// YouTube havolani qabul qilish uchun
bot.on('text', async (ctx) => {
  const youtubeUrl = ctx.message.text;
  try {
    if (!ytdl.validateURL(youtubeUrl)) {
      throw new Error('Noto\'g\'ri YouTube havola formati');
    }

    // Youtubedan video haqida ma'lumot olish
    const info = await ytdl.getInfo(youtubeUrl);
    const videoTitle = info.videoDetails.title;
    const audioStream = ytdl(youtubeUrl, { filter: 'audioonly' });
    const videoStream = ytdl(youtubeUrl, { filter: 'videoandaudio' });

    // Video nomini va streamni yuborish
    ctx.reply(`Audio yuklanmoqda: ${videoTitle}`);
    ctx.replyWithAudio({ source: audioStream });

    // Statistikaga qo'shish
    const audioStats = getStats('Audio', videoTitle);
    bot.telegram.sendMessage(channelId, audioStats);

    // Kuting
    audioStream.on('end', () => {
      ctx.reply(`Biroz kuting Video ham yuklab beriladi`);
      ctx.replyWithVideo({ source: videoStream });

      // Statistikaga qo'shish
      const videoStats = getStats('Video', videoTitle);
      bot.telegram.sendMessage(channelId, videoStats);
    });
  } catch (error) {
    console.error(error);
    ctx.reply('Xatolik yuz berdi. Iltimos, togri YouTube havolani yuboring.');
  }
});

// Botni ishga tushirish
bot.launch().then(() => {
  console.log('Bot ishga tushirildi');
}).catch((err) => {
  console.error('Bot ishga tushirishda xatolik:', err);
});
