/* Данные компании — единый источник для шапки, формы, подвала.
   Источник: docs/ТЗ-главная.md, ответы клиента. Пустая строка = клиент ещё
   не прислала: компонент такой пункт не выводит (заглушек на сайте нет). */
export const company = {
  name: 'Канцлер',
  /* Основатель — «обозначить его» (ответ клиента) */
  founder: { name: 'Диков Вадим Александрович', role: 'основатель' },
  since: 2012,
  region: 'Москва и МО',
  remote: 'Работаем дистанционно',
  hours: 'с 8:00 до 20:00',

  /* Ждём от клиента (пользователь спросит) */
  phone: '', // «+7 (XXX) XXX-XX-XX»
  phoneHref: '', // «+7XXXXXXXXXX»
  telegram: '', // https://t.me/…
  whatsapp: '', // https://wa.me/…

  /* Реквизиты для подвала — ждём */
  legalName: '',
  inn: '',
  ogrn: '',

  /* Куда уходят заявки (для справки; отправка идёт через PUBLIC_LEAD_ENDPOINT) */
  leadEmail: 'kanc_konsalt@mail.ru',
};

export const nav = [
  { href: '#uslugi', label: 'Услуги' },
  { href: '#keysy', label: 'Кейсы' },
  { href: '#o-kompanii', label: 'О компании' },
  { href: '#zayavka', label: 'Контакты' },
];
