/* Число по-русски: пробел-разделитель тысяч (неразрывный), запятая в дробной части. */
export const num = (v: number) =>
  v.toLocaleString('ru-RU', { maximumFractionDigits: 2 }).replace(/\s/g, ' ').replace('-', '−');
