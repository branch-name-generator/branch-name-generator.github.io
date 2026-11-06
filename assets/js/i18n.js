import { load, save } from "./storage.js";

export const LANGS = ["en", "uk"];

const messages = {
  en: {
    "meta.title": "Git Branch Name Generator — branch names from issue number and title",
    "meta.description":
      "Free online Git branch name generator: paste an issue number and title and get a valid branch name plus ready-to-copy git switch, create and commit commands.",
    "lang.switch": "UA",
    "lang.switchTitle": "Перемкнути на українську",
    "theme.toggle": "Toggle theme",
    "h1": "Git Branch Name Generator",
    "intro": "Paste the issue number and title to get a valid Git branch name and ready-to-run commands.",
    "issue.number": "Issue number",
    "issue.numberPlaceholder": "e.g. 1234, PROJ-123 or an issue URL",
    "issue.numberHint": "Separate a sub-issue with a space: “123 456” becomes 123/456/…",
    "issue.name": "Issue title",
    "issue.namePlaceholder": "e.g. Fix login bug",
    "btn.paste": "Paste",
    "btn.copy": "Copy",
    "btn.clear": "Clear",
    "btn.clearAll": "Clear fields",
    "btn.copied": "Copied!",
    "btn.pasted": "Pasted!",
    "btn.failed": "Failed",
    "paste.unsupported": "Clipboard access is blocked or unsupported. Click the field and press Ctrl+V.",
    "base.legend": "Base branch",
    "base.custom": "Custom",
    "base.customPlaceholder": "e.g. develop",
    "base.customLabel": "Custom base branch name",
    "settings.summary": "Branch name settings",
    "settings.prefix": "Prefix",
    "settings.prefixPlaceholder": "e.g. feature",
    "settings.separator": "Word separator",
    "settings.maxLength": "Max title length",
    "settings.reset": "Reset settings",
    "out.branch": "Git branch name",
    "out.empty": "Enter an issue number or title to see the result.",
    "cmd.heading": "Commands",
    "cmd.update": "Update the base branch",
    "cmd.create": "Create the branch",
    "cmd.switchTo": "Switch to the branch",
    "cmd.commit": "Empty commit",
    "cmd.all": "Everything in one command",
    "cmd.hotkey": "Ctrl+Enter copies the combined command.",
    "err.chars": "Contains characters Git does not allow in branch names.",
    "err.sequence": "Must not contain “..” or “@{”.",
    "err.slash": "Slashes must be in the middle and not doubled.",
    "err.dash": "Must not start with “-”.",
    "err.dot": "Must not end with “.”.",
    "err.component": "Parts must not start with “.” or end with “.lock”.",
    "err.at": "“@” alone is not a valid name.",
    "err.empty": "Name is empty.",
    "err.base": "The base branch name is not valid: {reason}",
    "history.heading": "Recent branches",
    "history.empty": "Branches you copy will appear here.",
    "history.clear": "Clear history",
    "history.restore": "Restore this issue",
    "how.heading": "How it works",
    "how.body":
      "The title is transliterated (Ukrainian and Russian included), lower-cased, and everything except letters and digits becomes a separator. The issue number goes in front, so “1234” and “Fix login bug” give 1234/fix-login-bug. Everything runs in your browser; nothing you type is sent anywhere.",
    "faq.heading": "FAQ",
    "faq.q1": "Which characters are not allowed in a Git branch name?",
    "faq.a1":
      "Spaces, ~ ^ : ? * [ \\, the sequences “..” and “@{”, a leading “-”, a trailing “.” or “/”, and path parts ending in “.lock”. The generator removes all of them.",
    "faq.q2": "Can I paste an issue link?",
    "faq.a2": "Yes. Links from GitHub, GitLab, Jira and Linear are reduced to the issue key (for example PROJ-123).",
    "faq.q3": "Why does the commit command use single quotes?",
    "faq.a3": "In bash and zsh single quotes stop $, backticks and ! in the title from being interpreted. On Windows PowerShell, edit the quoting.",
    "faq.q4": "Are my settings saved?",
    "faq.a4": "The base branch, prefix and other settings are kept in this browser’s local storage. The fields themselves are kept in the page address, so you can bookmark them.",
    "footer.made": "Created with ❤️ by",
    "footer.source": "Source code",
    "footer.cookies": "Cookie settings",
    "consent.text":
      "May we use Google Analytics to count visits? It is off until you agree, and nothing you type is ever sent.",
    "consent.accept": "Accept",
    "consent.decline": "Decline",
    "consent.status.granted": "Analytics: on",
    "consent.status.denied": "Analytics: off",
    "consent.reload": "Analytics turned off. Reload the page to fully stop it.",
    "noscript": "This tool needs JavaScript to generate branch names.",
  },
  uk: {
    "meta.title": "Генератор назв Git-гілок — з номера та назви задачі",
    "meta.description":
      "Безкоштовний онлайн-генератор назв Git-гілок: вставте номер і назву задачі та отримайте коректну назву гілки і готові команди switch, create та commit.",
    "lang.switch": "EN",
    "lang.switchTitle": "Switch to English",
    "theme.toggle": "Змінити тему",
    "h1": "Генератор назв Git-гілок",
    "intro": "Вставте номер і назву задачі, щоб отримати коректну назву Git-гілки та готові команди.",
    "issue.number": "Номер задачі",
    "issue.numberPlaceholder": "напр. 1234, PROJ-123 або посилання на задачу",
    "issue.numberHint": "Підзадачу додайте через пробіл: «123 456» дасть 123/456/…",
    "issue.name": "Назва задачі",
    "issue.namePlaceholder": "напр. Виправити помилку входу",
    "btn.paste": "Вставити",
    "btn.copy": "Копіювати",
    "btn.clear": "Очистити",
    "btn.clearAll": "Очистити поля",
    "btn.copied": "Скопійовано!",
    "btn.pasted": "Вставлено!",
    "btn.failed": "Помилка",
    "paste.unsupported": "Доступ до буфера обміну заблоковано або не підтримується. Клікніть у поле й натисніть Ctrl+V.",
    "base.legend": "Базова гілка",
    "base.custom": "Своя",
    "base.customPlaceholder": "напр. develop",
    "base.customLabel": "Назва своєї базової гілки",
    "settings.summary": "Налаштування назви гілки",
    "settings.prefix": "Префікс",
    "settings.prefixPlaceholder": "напр. feature",
    "settings.separator": "Роздільник слів",
    "settings.maxLength": "Макс. довжина назви",
    "settings.reset": "Скинути налаштування",
    "out.branch": "Назва Git-гілки",
    "out.empty": "Введіть номер або назву задачі, щоб побачити результат.",
    "cmd.heading": "Команди",
    "cmd.update": "Оновити базову гілку",
    "cmd.create": "Створити гілку",
    "cmd.switchTo": "Переключитись на гілку",
    "cmd.commit": "Порожній коміт",
    "cmd.all": "Все однією командою",
    "cmd.hotkey": "Ctrl+Enter копіює об’єднану команду.",
    "err.chars": "Містить символи, заборонені в назвах гілок Git.",
    "err.sequence": "Не може містити «..» або «@{».",
    "err.slash": "Слеші мають бути всередині й не подвоєні.",
    "err.dash": "Не може починатися з «-».",
    "err.dot": "Не може закінчуватися на «.».",
    "err.component": "Частини не можуть починатися з «.» чи закінчуватися на «.lock».",
    "err.at": "Одиночний «@» — недопустима назва.",
    "err.empty": "Назва порожня.",
    "err.base": "Назва базової гілки некоректна: {reason}",
    "history.heading": "Останні гілки",
    "history.empty": "Тут з’являтимуться гілки, які ви скопіюєте.",
    "history.clear": "Очистити історію",
    "history.restore": "Відновити цю задачу",
    "how.heading": "Як це працює",
    "how.body":
      "Назва транслітерується (українська й російська теж), переводиться в нижній регістр, а все, крім літер і цифр, стає роздільником. Номер задачі йде попереду, тож «1234» і «Fix login bug» дають 1234/fix-login-bug. Усе відбувається у вашому браузері, введене нікуди не надсилається.",
    "faq.heading": "Часті запитання",
    "faq.q1": "Які символи заборонені в назві Git-гілки?",
    "faq.a1":
      "Пробіли, ~ ^ : ? * [ \\, послідовності «..» та «@{», «-» на початку, «.» або «/» в кінці та частини шляху, що закінчуються на «.lock». Генератор прибирає їх усі.",
    "faq.q2": "Чи можна вставити посилання на задачу?",
    "faq.a2": "Так. Посилання з GitHub, GitLab, Jira та Linear скорочуються до ключа задачі (наприклад, PROJ-123).",
    "faq.q3": "Чому в команді коміту одинарні лапки?",
    "faq.a3": "У bash і zsh одинарні лапки не дають інтерпретувати $, зворотні лапки та ! у назві. У Windows PowerShell змініть лапки вручну.",
    "faq.q4": "Чи зберігаються мої налаштування?",
    "faq.a4": "Базова гілка, префікс та інші налаштування зберігаються в локальному сховищі цього браузера. Самі поля зберігаються в адресі сторінки, тож їх можна додати в закладки.",
    "footer.made": "Створено з ❤️",
    "footer.source": "Вихідний код",
    "footer.cookies": "Налаштування cookie",
    "consent.text":
      "Можна використовувати Google Analytics для підрахунку відвідувань? Доки ви не погодитесь, він вимкнений, а введені вами дані ніколи не надсилаються.",
    "consent.accept": "Погодитись",
    "consent.decline": "Відмовитись",
    "consent.status.granted": "Аналітика: увімкнена",
    "consent.status.denied": "Аналітика: вимкнена",
    "consent.reload": "Аналітику вимкнено. Перезавантажте сторінку, щоб повністю її зупинити.",
    "noscript": "Для генерації назв гілок потрібен JavaScript.",
  },
};

let current = "en";
const listeners = [];

export function detectLang() {
  const saved = load("lang");
  if (LANGS.includes(saved)) return saved;
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  return nav.toLowerCase().startsWith("uk") ? "uk" : "en";
}

export function t(key, vars = {}) {
  const text = messages[current][key] ?? messages.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

export function getLang() {
  return current;
}

export function onLangChange(fn) {
  listeners.push(fn);
}

export function applyTranslations(root = document) {
  document.documentElement.lang = current;
  document.title = t("meta.title");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t("meta.description"));

  for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll("[data-i18n-placeholder]")) {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  }
  for (const el of root.querySelectorAll("[data-i18n-title]")) {
    const text = t(el.dataset.i18nTitle);
    el.setAttribute("title", text);
    el.setAttribute("aria-label", text);
  }
}

export function setLang(lang, { persist = true } = {}) {
  current = LANGS.includes(lang) ? lang : "en";
  if (persist) save("lang", current);
  applyTranslations();
  for (const fn of listeners) fn(current);
}
