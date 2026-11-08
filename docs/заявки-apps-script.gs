/**
 * Канцлер — приём заявок с сайта kancler-fin.ru (05.11.2026).
 * Каждая заявка: строка в Google Таблицу + письмо на почту + (по желанию) Telegram.
 *
 * Почему так: письмо отправляет Gmail владельца таблицы (MailApp) — подписано Google,
 * mail.ru его не режет, в отличие от mail() с хостинга. Telegram шлётся отсюда, потому что
 * api.telegram.org из браузеров в РФ недоступен. Токены — в Script Properties, не в коде.
 *
 * НАСТРОЙКА (один раз, у таблицы: Расширения → Apps Script, вставить этот код целиком):
 *  1. Project Settings (шестерёнка) → Script Properties → Add:
 *       LEAD_EMAILS          = kanc_konsalt@mail.ru   (можно несколько через запятую)
 *       TELEGRAM_BOT_TOKEN   = токен бота от @BotFather        (необязательно)
 *       TELEGRAM_CHAT_IDS    = id чатов через запятую          (необязательно)
 *  2. Вверху выбрать функцию authorize → ▶ Выполнить → разрешить доступ
 *     (почта и внешние запросы; на экране «Google не проверил приложение» —
 *     Дополнительные настройки → Перейти к проекту). Придёт проверочное письмо.
 *  3. Deploy → New deployment → тип Web app → Execute as: Me, Who has access: Anyone
 *     → Deploy → скопировать адрес, оканчивающийся на /exec, и прислать разработчику.
 *  После любой правки кода: Deploy → Manage deployments → карандаш → Version: New version.
 *
 * Сайт шлёт JSON: { name, phone, email, comment, topic, page } (email — по желанию, с 06.11.2026).
 */

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  try { appendRow(d); } catch (err) {}      // запись — первой: таблица — главный архив
  notifyEmail(d);
  notifyTelegram(d);
  return ContentService.createTextOutput('ok');
}

function leadText(d) {
  return 'Имя: ' + (d.name || '') + '\n' +
    'Телефон: ' + (d.phone || '') + '\n' +
    (d.email ? 'Почта: ' + d.email + '\n' : '') +
    (d.comment ? 'Комментарий: ' + d.comment + '\n' : '') +
    'Форма: ' + (d.topic || '') + '\n' +
    'Страница: ' + (d.page || '');
}

function notifyEmail(d) {
  try {
    var to = PropertiesService.getScriptProperties().getProperty('LEAD_EMAILS');
    if (!to) return;
    MailApp.sendEmail({
      to: to,
      subject: 'Заявка с сайта kancler-fin.ru — ' + (d.name || 'без имени'),
      body: 'Новая заявка с сайта kancler-fin.ru\n\n' + leadText(d) +
        '\n\nВсе заявки — в Google Таблице ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      name: 'Сайт Канцлер'
    });
  } catch (err) {}
}

function notifyTelegram(d) {
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('TELEGRAM_BOT_TOKEN');
    var chats = (props.getProperty('TELEGRAM_CHAT_IDS') || '').split(',');
    if (!token) return;
    chats.forEach(function (id) {
      id = id.trim();
      if (!id) return;
      UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'post',
        payload: { chat_id: id, text: 'Новая заявка с сайта\n\n' + leadText(d) },
        muteHttpExceptions: true
      });
    });
  } catch (err) {}
}

function appendRow(d) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(['Дата', 'Имя', 'Телефон', 'Почта', 'Комментарий', 'Форма', 'Страница']);
  sheet.appendRow([
    new Date(),
    d.name || '',
    "'" + (d.phone || ''),   // апостроф — чтобы «+7…» не стал формулой/числом
    d.email || '',
    d.comment || '',
    d.topic || '',
    d.page || ''
  ]);
}

/** Узнать id чата: добавить бота в группу, написать в группе любое сообщение,
 *  запустить эту функцию — id групп и личных чатов появятся в «Журнале выполнения».
 *  У группы id отрицательный (-100…), его целиком — в TELEGRAM_CHAT_IDS. */
function findChatIds() {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) { console.log('Сначала добавьте свойство TELEGRAM_BOT_TOKEN'); return; }
  var res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates', { muteHttpExceptions: true }).getContentText());
  var seen = {};
  (res.result || []).forEach(function (u) {
    var m = u.message || u.my_chat_member || u.channel_post;
    if (m && m.chat && !seen[m.chat.id]) { seen[m.chat.id] = 1; console.log(m.chat.id + '  —  ' + (m.chat.title || m.chat.first_name || '')); }
  });
  if (!Object.keys(seen).length) console.log('Пусто: напишите сообщение в группе с ботом и запустите ещё раз. ' + (res.description || ''));
}

/** Запустить один раз кнопкой «Выполнить»: выдаёт разрешения и шлёт проверочное письмо/сообщение. */
function authorize() {
  var test = { name: 'Проверка связи', phone: '—', topic: 'authorize()', page: '' };
  notifyEmail(test);
  notifyTelegram(test);
}
