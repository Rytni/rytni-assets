const activeManifestSchema={"$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "urn:rytni:active-manifest:3", "type": "object", "additionalProperties": false, "properties": {"schema_version": {"const": 3}, "account_key": {"type": "string", "pattern": "^[a-z][a-z0-9-]{0,63}$"}, "username": {"type": "string", "pattern": "^[a-z0-9_.]{1,24}$"}, "media_kit_slug": {"type": "string", "pattern": "^[a-z][a-z0-9-]{0,63}$"}, "release_id": {"type": "string", "pattern": "^[a-f0-9]{64}$"}, "release_sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"}, "release_url": {"type": "string", "format": "uri"}, "published_at": {"type": "string", "format": "date-time"}, "data_updated_at": {"type": "string", "format": "date"}, "period": {"type": "object", "additionalProperties": false, "properties": {"type": {"const": "CALENDAR_WINDOW"}, "start": {"type": "string", "format": "date"}, "end": {"type": "string", "format": "date"}, "days": {"type": "integer", "minimum": 1, "maximum": 365}, "boundaries": {"const": "INCLUSIVE"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "normalized_timezone": {"type": ["string", "null"]}}, "required": ["type", "start", "end", "days", "boundaries", "source_timezone", "normalized_timezone"]}, "previous_release_id": {"type": ["string", "null"], "pattern": "^[a-f0-9]{64}$"}}, "required": ["schema_version", "account_key", "username", "media_kit_slug", "release_id", "release_sha256", "release_url", "published_at", "data_updated_at", "period", "previous_release_id"]};
export const publicSchema={"$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "urn:rytni:public-media-kit:2", "type": "object", "additionalProperties": false, "properties": {"schema_version": {"const": 2}, "account_key": {"type": "string", "pattern": "^[a-z][a-z0-9-]{0,63}$"}, "username": {"type": "string", "pattern": "^[a-z0-9_.]{1,24}$"}, "media_kit_slug": {"type": "string", "pattern": "^[a-z][a-z0-9-]{0,63}$"}, "generated_at": {"type": "string", "format": "date-time"}, "freshness": {"type": "object", "additionalProperties": false, "properties": {"status": {"enum": ["FRESH", "PARTIAL", "STALE"]}, "data_as_of_date": {"type": "string", "format": "date"}, "stale_after_days": {"type": "integer", "minimum": 1}}, "required": ["status", "data_as_of_date", "stale_after_days"]}, "current": {"type": "object", "additionalProperties": false, "properties": {"followers": {"type": "object", "additionalProperties": false, "properties": {"value": {"type": "integer", "minimum": 0}, "as_of_date": {"type": "string", "format": "date"}, "captured_at": {"type": "string", "format": "date-time"}, "source": {"const": "DATA_EXPORT"}, "precision": {"const": "DATE_ONLY"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}}, "required": ["value", "as_of_date", "captured_at", "source", "precision", "source_timezone"]}}, "required": ["followers"]}, "period": {"type": "object", "additionalProperties": false, "properties": {"period_type": {"const": "CALENDAR_WINDOW"}, "period_start": {"type": "string", "format": "date"}, "period_end": {"type": "string", "format": "date"}, "boundaries": {"const": "INCLUSIVE"}, "calendar_days": {"type": "integer", "minimum": 1, "maximum": 365}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "normalized_timezone": {"type": ["string", "null"]}, "captured_at": {"type": "string", "format": "date-time"}, "metrics": {"type": "object", "additionalProperties": false, "properties": {"views": {"type": "object", "additionalProperties": false, "properties": {"value": {"type": "integer", "minimum": 0}, "captured_at": {"type": "string", "format": "date-time"}, "period_start": {"type": "string", "format": "date"}, "period_end": {"type": "string", "format": "date"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "source": {"const": "DATA_EXPORT"}}, "required": ["value", "captured_at", "period_start", "period_end", "source_timezone", "source"]}, "likes": {"type": "object", "additionalProperties": false, "properties": {"value": {"type": "integer", "minimum": 0}, "captured_at": {"type": "string", "format": "date-time"}, "period_start": {"type": "string", "format": "date"}, "period_end": {"type": "string", "format": "date"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "source": {"const": "DATA_EXPORT"}}, "required": ["value", "captured_at", "period_start", "period_end", "source_timezone", "source"]}, "comments": {"type": "object", "additionalProperties": false, "properties": {"value": {"type": "integer", "minimum": 0}, "captured_at": {"type": "string", "format": "date-time"}, "period_start": {"type": "string", "format": "date"}, "period_end": {"type": "string", "format": "date"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "source": {"const": "DATA_EXPORT"}}, "required": ["value", "captured_at", "period_start", "period_end", "source_timezone", "source"]}, "shares": {"type": "object", "additionalProperties": false, "properties": {"value": {"type": "integer", "minimum": 0}, "captured_at": {"type": "string", "format": "date-time"}, "period_start": {"type": "string", "format": "date"}, "period_end": {"type": "string", "format": "date"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "source": {"const": "DATA_EXPORT"}}, "required": ["value", "captured_at", "period_start", "period_end", "source_timezone", "source"]}, "profile_views": {"type": "object", "additionalProperties": false, "properties": {"value": {"type": "integer", "minimum": 0}, "captured_at": {"type": "string", "format": "date-time"}, "period_start": {"type": "string", "format": "date"}, "period_end": {"type": "string", "format": "date"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "source": {"const": "DATA_EXPORT"}}, "required": ["value", "captured_at", "period_start", "period_end", "source_timezone", "source"]}}, "required": []}}, "required": ["period_type", "period_start", "period_end", "boundaries", "calendar_days", "source_timezone", "normalized_timezone", "captured_at", "metrics"]}, "audience": {"type": "object", "additionalProperties": false, "properties": {"population": {"const": "followers"}, "captured_at": {"type": "string", "format": "date-time"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "gender": {"type": "array", "minItems": 1, "maxItems": 100, "items": {"type": "object", "additionalProperties": false, "properties": {"label": {"type": "string", "pattern": "^(male|female|other)$"}, "fraction": {"type": "number", "minimum": 0, "maximum": 1}}, "required": ["label", "fraction"]}}, "age": {"type": "array", "minItems": 1, "maxItems": 100, "items": {"type": "object", "additionalProperties": false, "properties": {"label": {"type": "string", "pattern": "^(?:[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\\+)$"}, "fraction": {"type": "number", "minimum": 0, "maximum": 1}}, "required": ["label", "fraction"]}}, "geography": {"type": "array", "minItems": 1, "maxItems": 100, "items": {"type": "object", "additionalProperties": false, "properties": {"label": {"type": "string", "pattern": "^(?:[A-Z]{2}|OTHER)$"}, "fraction": {"type": "number", "minimum": 0, "maximum": 1}}, "required": ["label", "fraction"]}}}, "required": ["population", "captured_at", "source_timezone"]}, "history": {"type": "object", "additionalProperties": false, "properties": {"followers": {"type": "array", "maxItems": 1500, "items": {"type": "object", "additionalProperties": false, "properties": {"date": {"type": "string", "format": "date"}, "value": {"type": "integer", "minimum": 0}}, "required": ["date", "value"]}}, "period_snapshots": {"type": "array", "maxItems": 1500, "items": {"type": "object", "additionalProperties": false, "properties": {"period_start": {"type": "string", "format": "date"}, "period_end": {"type": "string", "format": "date"}, "calendar_days": {"type": "integer", "minimum": 1}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "captured_at": {"type": "string", "format": "date-time"}, "metrics": {"type": "object", "additionalProperties": false, "properties": {"views": {"type": "integer", "minimum": 0}, "likes": {"type": "integer", "minimum": 0}, "comments": {"type": "integer", "minimum": 0}, "shares": {"type": "integer", "minimum": 0}, "profile_views": {"type": "integer", "minimum": 0}}, "required": []}}, "required": ["period_start", "period_end", "calendar_days", "source_timezone", "captured_at", "metrics"]}}, "daily_series": {"type": "array", "maxItems": 365, "items": {"type": "object", "additionalProperties": false, "properties": {"date": {"type": "string", "format": "date"}, "source_timezone": {"enum": ["SOURCE_TIMEZONE_UNKNOWN", "UTC", "Europe/Minsk"]}, "metrics": {"type": "object", "additionalProperties": false, "properties": {"views": {"type": "integer", "minimum": 0}, "likes": {"type": "integer", "minimum": 0}, "comments": {"type": "integer", "minimum": 0}, "shares": {"type": "integer", "minimum": 0}, "profile_views": {"type": "integer", "minimum": 0}}, "required": []}}, "required": ["date", "source_timezone", "metrics"]}}}, "required": ["followers", "period_snapshots", "daily_series"]}}, "required": ["schema_version", "account_key", "username", "media_kit_slug", "generated_at", "freshness", "current", "period", "audience", "history"]};
const content={"shared": {"ru": {"home": "Главная", "stats": "В цифрах", "audience": "Аудитория", "formats": "Форматы", "contact": "Обсудить сотрудничество", "follow": "Открыть TikTok", "followers": "Подписчики", "views": "Просмотры", "likes": "Лайки", "comments": "Комментарии", "shares": "Поделились", "profile_views": "Просмотры профиля", "updated": "Данные обновлены: ", "period": "Статистика за: ", "statsTitle": "Внимание, которое получает ваш бренд.", "audienceTitle": "Люди по ту сторону экрана.", "gender": "Пол аудитории", "age": "Возраст", "geography": "География", "audienceNote": "Демография подписчиков TikTok. Доли округлены источником.", "brandsTitle": "Почему канал подходит брендам", "topicsTitle": "Контент с понятным контекстом.", "formatsTitle": "Найдём формат для вашей задачи.", "contactTitle": "Давайте сделаем<br>что-то интересное.", "contactNote": "Расскажите о продукте, сроках и задаче. Обсудим идею и подходящий формат лично.", "email": "Написать на почту", "telegram": "Связаться в Telegram", "footer": "RYTNI · Media Kit", "unavailable": "Данные недоступны", "fallback": "Последние проверенные данные", "stale": "Дата последнего обновления указана выше", "male": "Мужчины", "female": "Женщины", "other": "Другое", "otherCountries": "Другие страны"}, "en": {"home": "Home", "stats": "By the numbers", "audience": "Audience", "formats": "Formats", "contact": "Let’s collaborate", "follow": "View TikTok", "followers": "Followers", "views": "Views", "likes": "Likes", "comments": "Comments", "shares": "Shares", "profile_views": "Profile views", "updated": "Data updated: ", "period": "Statistics for: ", "statsTitle": "Attention your brand can be part of.", "audienceTitle": "The people behind the screen.", "gender": "Audience gender", "age": "Age", "geography": "Geography", "audienceNote": "TikTok follower demographics. Shares are rounded by the source.", "brandsTitle": "Why this channel works for brands", "topicsTitle": "Content with a clear context.", "formatsTitle": "The right format for your brief.", "contactTitle": "Let’s make<br>something interesting.", "contactNote": "Tell us about your product, timing and brief. We’ll discuss the idea and a suitable format together.", "email": "Send an email", "telegram": "Message on Telegram", "footer": "RYTNI · Media Kit", "unavailable": "Data unavailable", "fallback": "Last verified data", "stale": "The last update date is shown above", "male": "Male", "female": "Female", "other": "Other", "otherCountries": "Other countries"}}, "accessibility": {"ru": {"navigation": "Основная навигация", "language": "Язык", "skip": "Перейти к статистике", "avatar": "Брендовый аватар RYTNI"}, "en": {"navigation": "Main navigation", "language": "Language", "skip": "Skip to statistics", "avatar": "RYTNI brand avatar"}}, "accounts": {"gaming": {"ru": {"name": "Игровой Rytni", "category": "GAMING / MEDIA", "headline": "В центре<br>игровой повестки.", "intro": "Игры, релизы и инфоповоды — для аудитории, которая живёт геймингом.", "visual": "Игры. Люди. Инфоповоды.", "brandLead": "Ваш продукт — часть разговора об играх.", "brandBody": "Актуальные новости, трейлеры и релизы создают естественный контекст для интеграций издателей, hardware-брендов и производителей периферии.", "benefits": [["Контекст", "Продукт появляется в знакомой аудитории игровой повестке."], ["Нативная подача", "Идею интеграции адаптируем под привычный зрителям формат."], ["Разные задачи", "От знакомства с релизом до серии публикаций о продукте."]], "topics": ["Игры", "Трейлеры", "Анонсы", "Гейминг-медиа", "Периферия", "Железо", "Релизы", "Инфоповоды"], "position": "От нового трейлера до игрового устройства: показываем, где продукт встречается с интересами аудитории.", "formats": [["Нативная интеграция", "Продукт органично появляется в тематическом ролике."], ["Анонс релиза", "Знакомим аудиторию с игрой, событием или обновлением."], ["Презентация продукта", "Показываем устройство или сервис в игровом контексте."], ["Серия публикаций", "Развиваем идею в нескольких последовательных материалах."], ["Спецформат", "Обсуждаем отдельную идею под задачу вашего бренда."]]}, "en": {"name": "Gaming Rytni", "category": "GAMING / MEDIA", "headline": "At the heart<br>of gaming culture.", "intro": "Games, releases and the stories that matter — for an audience that lives gaming.", "visual": "Games. People. Stories.", "brandLead": "Your product joins the gaming conversation.", "brandBody": "News, trailers and releases create a natural context for publishers, hardware brands and peripheral makers to connect with the audience.", "benefits": [["Relevant context", "Your product appears within a gaming conversation the audience knows."], ["Native delivery", "The integration idea fits the format viewers already enjoy."], ["Different briefs", "From introducing a release to a series focused on your product."]], "topics": ["Games", "Trailers", "Announcements", "Gaming media", "Peripherals", "Hardware", "Releases", "Gaming stories"], "position": "From a new trailer to a gaming device: a clear meeting point between your product and the audience’s interests.", "formats": [["Native integration", "Your product appears naturally in a relevant video."], ["Release announcement", "Introduce a game, event or update to the audience."], ["Product presentation", "Show a device or service in a gaming context."], ["Publication series", "Develop the idea across several consecutive pieces."], ["Custom format", "A tailored concept built around your brand’s brief."]]}}, "tech": {"ru": {"name": "Rytni.exe", "category": "TECH / MEDIA", "headline": "Технологии.<br>Ближе к людям.", "intro": "Windows, программы, ПК и гаджеты — понятный контент о технологиях, которыми пользуются каждый день.", "visual": "Технологии. В реальном мире.", "brandLead": "Покажите, как ваш продукт работает в жизни.", "brandBody": "Программы, комплектующие и устройства получают понятный контекст: сценарии использования, функции и детали, которые интересны tech-аудитории.", "benefits": [["Практический контекст", "Продукт становится частью разговора о ПК и повседневных технологиях."], ["Понятная демонстрация", "Показываем функции и сценарии использования в коротком видео."], ["Актуальная тематика", "Windows, софт, железо и гаджеты — рядом с технологическими новостями."]], "topics": ["Windows", "Программы", "ПК", "Комплектующие", "Периферия", "Гаджеты", "Технологии"], "position": "Обновления Windows, полезный софт, устройства и новости: продукт интегрируется там, где он помогает решать понятную задачу.", "formats": [["Нативная интеграция", "Продукт появляется в подходящей технологической теме."], ["Обзор / демонстрация", "Показываем функции, детали и сценарии использования."], ["Анонс продукта", "Знакомим аудиторию с новым устройством или сервисом."], ["Серия роликов", "Раскрываем несколько возможностей продукта поэтапно."], ["Спецформат", "Создаём индивидуальную идею под ваш продукт и задачу."]]}, "en": {"name": "Rytni.exe", "category": "TECH / MEDIA", "headline": "Technology.<br>Closer to people.", "intro": "Windows, software, PCs and gadgets — approachable stories about the technology people use every day.", "visual": "Technology. In the real world.", "brandLead": "Show how your product works in real life.", "brandBody": "Software, components and devices get a clear context: use cases, features and details that matter to a tech audience.", "benefits": [["Practical context", "Your product joins the conversation about PCs and everyday technology."], ["Clear demonstration", "Show features and use cases through short video."], ["Relevant topics", "Windows, software, hardware and gadgets alongside technology news."]], "topics": ["Windows", "Software", "PCs", "Components", "Peripherals", "Gadgets", "Technology"], "position": "Windows updates, useful software, devices and news: your product fits where it helps solve a clear, practical task.", "formats": [["Native integration", "Your product appears within a relevant technology topic."], ["Review / demonstration", "Show features, details and real use cases."], ["Product announcement", "Introduce a new device or service to the audience."], ["Video series", "Explore different product capabilities step by step."], ["Custom format", "A concept tailored to your product and brief."]]}}}};
const approvedCopy={"gaming": {"text": {"root/0/0/0": {"ru": "Главная", "en": "Home"}, "root/0/1/0": {"ru": "Игровой Rytni", "en": "Gaming Rytni"}, "root/0/2/0": {"ru": "Rytni.exe", "en": "Rytni.exe"}, "root/0/3/0/0": {"ru": "RU", "en": "RU"}, "root/0/3/1/0": {"ru": "ENG", "en": "ENG"}, "root/1/0/0/0/0/0": {"ru": "Media Kit 2026", "en": "Media Kit 2026"}, "root/1/0/0/0/1/0/0": {"ru": "Игровой ", "en": "Gaming "}, "root/1/0/0/0/1/0/1/0": {"ru": "Rytni", "en": "Rytni"}, "root/1/0/0/0/1/1/0": {"ru": "Игровые новости, релизы, трейлеры и выставки для вовлечённой геймерской аудитории.", "en": "Gaming news, releases, trailers, and industry events for an engaged gamer audience."}, "root/1/0/0/0/2/0/1/0": {"ru": "подписчиков TikTok", "en": "TikTok followers"}, "root/1/0/0/0/2/1/1/0": {"ru": "просмотров за указанный период", "en": "views in the stated period"}, "root/1/0/0/0/2/2/1/0": {"ru": "лайков за указанный период", "en": "likes in the stated period"}, "root/1/0/0/0/3/0/0": {"ru": "Написать на почту", "en": "Send an email"}, "root/1/0/0/0/3/1/0": {"ru": "Перейти на TikTok-канал Игровой Rytni", "en": "Visit the Gaming Rytni TikTok channel"}, "root/1/0/1/0/1/1/0": {"ru": "Кому подходит канал", "en": "Ideal brand partners"}, "root/1/0/1/0/1/2/0": {"ru": "Игровым брендам, издателям, периферии, сервисам и событиям индустрии.", "en": "Gaming brands, publishers, peripheral makers, services, and industry events."}, "root/1/0/1/0/2/1/0": {"ru": "Что получает партнёр", "en": "What partners get"}, "root/1/0/1/0/2/2/0": {"ru": "Большой охват и естественную интеграцию продукта в игровую повестку.", "en": "Strong reach and natural product integration into current gaming conversations."}, "root/1/1/0/0": {"ru": "Ключевые метрики", "en": "Key metrics"}, "root/1/1/4/0/0/1/0": {"ru": "Подписчики", "en": "Followers"}, "root/1/1/4/1/0/1/0": {"ru": "Просмотры", "en": "Views"}, "root/1/1/4/2/0/1/0": {"ru": "Лайки", "en": "Likes"}, "root/1/1/4/3/0/1/0": {"ru": "Поделились", "en": "Shares"}, "root/1/1/4/4/0/1/0": {"ru": "Комментарии", "en": "Comments"}, "root/1/1/4/5/0/1/0": {"ru": "Просмотры профиля", "en": "Profile views"}, "root/1/2/0/0/0/1": {"ru": "Портрет аудитории", "en": "Audience profile"}, "root/1/2/0/0/2/0": {"ru": "Возраст", "en": "Age"}, "root/1/2/0/1/0/1": {"ru": "География", "en": "Geography"}, "root/1/2/0/1/2/0": {"ru": "Основной охват — русскоязычная аудитория СНГ.", "en": "The channel primarily reaches Russian-speaking audiences across the CIS."}, "root/1/3/0/0": {"ru": "Почему канал подходит брендам", "en": "Why brands choose this channel"}, "root/1/3/1/0/0/1/0": {"ru": "Сильная сторона Игрового Rytni", "en": "The strength of Gaming Rytni"}, "root/1/3/1/0/0/2/0": {"ru": "Бренд становится частью актуальной игровой повестки, а интеграция выглядит естественно.", "en": "Your brand becomes part of the current gaming conversation through authentic, natural integration."}, "root/1/4/0/0": {"ru": "Форматы сотрудничества", "en": "Partnership formats"}, "root/1/4/1/0/1/0": {"ru": "Нативная интеграция", "en": "Native integration"}, "root/1/4/1/0/2/0": {"ru": "Продукт естественно встроен в игровой инфоповод.", "en": "A product is naturally integrated into a relevant gaming story."}, "root/1/4/1/1/1/0": {"ru": "Анонс релиза", "en": "Release announcement"}, "root/1/4/1/1/2/0": {"ru": "Быстрый охват для игр, DLC, платформ и событий.", "en": "Fast reach for games, DLC, platforms, and events."}, "root/1/4/1/2/1/0": {"ru": "Серия публикаций", "en": "Content series"}, "root/1/4/1/2/2/0": {"ru": "Последовательное присутствие и рост узнаваемости.", "en": "Consistent presence that builds brand awareness."}, "root/1/4/1/3/1/0": {"ru": "Спецформат под запуск", "en": "Custom launch format"}, "root/1/4/1/3/2/0": {"ru": "Отдельная концепция под релиз, выставку или событие.", "en": "A tailored concept for a release, trade show, or special event."}, "root/1/5/0/0/0/0/0": {"ru": "Контакты", "en": "Contact"}, "root/1/5/0/0/0/1/0": {"ru": "Рекламное сотрудничество", "en": "Brand partnerships"}, "root/1/5/0/0/0/2/0": {"ru": "Стоимость, форматы и свободные даты — в прямом сообщении.", "en": "Contact me directly for rates, available formats, and open booking dates."}, "root/1/5/0/0/1/0/1/0/0": {"ru": "Email", "en": "Email"}, "root/1/5/0/0/1/0/1/1/0": {"ru": "rytnitv@gmail.com", "en": "rytnitv@gmail.com"}, "root/1/5/0/0/1/1/1/0/0": {"ru": "Telegram", "en": "Telegram"}, "root/1/5/0/0/1/1/1/1/0": {"ru": "@ermediapr", "en": "@ermediapr"}, "root/1/5/0/0/1/2/1/0/0": {"ru": "TikTok", "en": "TikTok"}, "root/1/5/0/0/1/2/1/1/0": {"ru": "@rytni.tv", "en": "@rytni.tv"}, "root/1/6/0": {"ru": "Игровой Rytni Media Kit • 2026", "en": "Gaming Rytni Media Kit • 2026"}}, "topics": {"ru": ["Игры", "Трейлеры", "Анонсы", "Гейминг-медиа", "Периферия", "Железо", "Релизы", "Инфоповоды"], "en": ["Games", "Trailers", "Announcements", "Gaming media", "Peripherals", "Hardware", "Releases", "Trending topics"]}, "format_icons": ["https://rytni.github.io/rytni-assets/web/2/media-native.webp", "https://rytni.github.io/rytni-assets/web/2/media-announce.webp", "https://rytni.github.io/rytni-assets/web/2/media-series.webp", "https://rytni.github.io/rytni-assets/web/2/media-launch.webp"]}, "tech": {"text": {"root/0/0/0": {"ru": "Главная", "en": "Home"}, "root/0/1/0": {"ru": "Игровой Rytni", "en": "Rytni Gaming"}, "root/0/2/0": {"ru": "Rytni.exe", "en": "Rytni.exe"}, "root/0/3/0/0": {"ru": "RU", "en": "RU"}, "root/0/3/1/0": {"ru": "ENG", "en": "ENG"}, "root/1/0/0/0/0/0": {"ru": "Media Kit 2026", "en": "Media Kit 2026"}, "root/1/0/0/0/1/0/0": {"ru": "RYTNI", "en": "RYTNI"}, "root/1/0/0/0/1/0/1/0": {"ru": ".exe", "en": ".exe"}, "root/1/0/0/0/1/1/0": {"ru": "Игры, технологии и гаджеты для активной аудитории 18–34.", "en": "Gaming, technology, and gadgets for an engaged audience aged 18–34."}, "root/1/0/0/0/2/0/1/0": {"ru": "подписчиков TikTok", "en": "TikTok followers"}, "root/1/0/0/0/2/1/1/0": {"ru": "просмотров за указанный период", "en": "views in the stated period"}, "root/1/0/0/0/2/2/1/0": {"ru": "лайков за указанный период", "en": "likes in the stated period"}, "root/1/0/0/0/3/0/0": {"ru": "Написать на почту", "en": "Send an email"}, "root/1/0/0/0/3/1/0": {"ru": "Перейти на TikTok-канал Rytni.exe", "en": "Visit the Rytni.exe TikTok channel"}, "root/1/0/1/0/1/1/0": {"ru": "Кому подходит канал", "en": "Ideal brand partners"}, "root/1/0/1/0/1/2/0": {"ru": "Gaming- и tech-брендам, гаджетам, сервисам и маркетплейсам.", "en": "Gaming and tech brands, gadget makers, services, and marketplaces."}, "root/1/0/1/0/2/1/0": {"ru": "Что получает партнёр", "en": "What partners get"}, "root/1/0/1/0/2/2/0": {"ru": "Сильный охват и органичную демонстрацию продукта в контенте.", "en": "Strong reach and authentic product exposure within the content."}, "root/1/1/0/0": {"ru": "Ключевые метрики", "en": "Key metrics"}, "root/1/1/4/0/0/1/0": {"ru": "Подписчики", "en": "Followers"}, "root/1/1/4/1/0/1/0": {"ru": "Просмотры", "en": "Views"}, "root/1/1/4/2/0/1/0": {"ru": "Лайки", "en": "Likes"}, "root/1/1/4/3/0/1/0": {"ru": "Поделились", "en": "Shares"}, "root/1/1/4/4/0/1/0": {"ru": "Комментарии", "en": "Comments"}, "root/1/1/4/5/0/1/0": {"ru": "Просмотры профиля", "en": "Profile views"}, "root/1/2/0/0/0/1": {"ru": "Портрет аудитории", "en": "Audience profile"}, "root/1/2/0/0/2/0": {"ru": "Возраст", "en": "Age"}, "root/1/2/0/1/0/1": {"ru": "География", "en": "Geography"}, "root/1/2/0/1/2/0": {"ru": "Ядро аудитории сосредоточено в СНГ, что особенно полезно для игровых, техно- и digital-брендов, которым нужен понятный локальный охват.", "en": "The core audience is based in the CIS, making the channel especially valuable to gaming, tech, and digital brands seeking strong regional reach."}, "root/1/3/0/0": {"ru": "Почему это работает", "en": "Why it works"}, "root/1/3/1/0/0/1/0": {"ru": "Сильная сторона канала", "en": "The channel's strength"}, "root/1/3/1/0/0/2/0": {"ru": "Продукт органично появляется на пересечении игр, технологий и гаджетов.", "en": "Products appear naturally at the intersection of gaming, technology, and gadgets."}, "root/1/4/0/0": {"ru": "Форматы сотрудничества", "en": "Partnership formats"}, "root/1/4/1/0/1/0": {"ru": "Нативная интеграция", "en": "Native integration"}, "root/1/4/1/0/2/0": {"ru": "Продукт или сервис встраивается прямо в сюжет ролика, без ощущения отдельного рекламного блока.", "en": "A product or service is woven directly into the video's story without feeling like a separate ad break."}, "root/1/4/1/1/1/0": {"ru": "Обзор или разбор", "en": "Review or deep dive"}, "root/1/4/1/1/2/0": {"ru": "Подходит для железа, гаджетов, игровых аксессуаров, приложений и сервисов, где важна понятная демонстрация.", "en": "Ideal for hardware, gadgets, gaming accessories, apps, and services that benefit from a clear demonstration."}, "root/1/4/1/2/1/0": {"ru": "Анонс релиза", "en": "Release announcement"}, "root/1/4/1/2/2/0": {"ru": "Подогрев интереса к игре, продукту, обновлению или событию через быстрый, понятный и эмоциональный формат.", "en": "Build anticipation for a game, product, update, or event through a fast, clear, and engaging format."}, "root/1/4/1/3/1/0": {"ru": "Серия роликов", "en": "Video series"}, "root/1/4/1/3/2/0": {"ru": "Если нужен не один контакт, а последовательное присутствие бренда в ленте и более плотная работа на узнаваемость.", "en": "For brands that need consistent feed presence and stronger awareness rather than a single touchpoint."}, "root/1/5/0/0/0/0/0": {"ru": "Контакты", "en": "Contact"}, "root/1/5/0/0/0/1/0": {"ru": "Рекламное сотрудничество", "en": "Brand partnerships"}, "root/1/5/0/0/0/2/0": {"ru": "По вопросам стоимости, форматов размещения и свободных слотов лучше писать напрямую. Так эта страница выглядит уже не просто красиво, а как нормальный рабочий media kit для брендов.", "en": "For rates, available formats, and open booking slots, please get in touch directly. I will help find the right format for your campaign."}, "root/1/5/0/0/1/0/1/0/0": {"ru": "Email", "en": "Email"}, "root/1/5/0/0/1/0/1/1/0": {"ru": "rytnitv@gmail.com", "en": "rytnitv@gmail.com"}, "root/1/5/0/0/1/1/1/0/0": {"ru": "Telegram", "en": "Telegram"}, "root/1/5/0/0/1/1/1/1/0": {"ru": "@ermediapr", "en": "@ermediapr"}, "root/1/5/0/0/1/2/1/0/0": {"ru": "TikTok", "en": "TikTok"}, "root/1/5/0/0/1/2/1/1/0": {"ru": "@rytni.blic", "en": "@rytni.blic"}, "root/1/6/0": {"ru": "RYTNI.exe Media Kit • 2026", "en": "RYTNI.exe Media Kit • 2026"}}, "topics": {"ru": ["Gaming", "Железо", "Периферия", "Смартфоны", "Маркетплейсы", "Digital-сервисы", "Анонсы новинок", "Нативные интеграции"], "en": ["Gaming", "Hardware", "Peripherals", "Smartphones", "Marketplaces", "Digital services", "New product launches", "Native integrations"]}, "format_icons": ["https://rytni.github.io/rytni-assets/web/2/media-native.webp", "https://rytni.github.io/rytni-assets/web/2/media-review.webp", "https://rytni.github.io/rytni-assets/web/2/media-announce.webp", "https://rytni.github.io/rytni-assets/web/2/media-series.webp"]}};
// Scoped Tilda-compatible prototype. All output uses textContent / SVG DOM APIs.
const MAX_BYTES = 2_000_000;
const labels = {
  ru: {followers:"Подписчики",views:"Просмотры",likes:"Лайки",comments:"Комментарии",shares:"Shares",profile_views:"Просмотры профиля",
    accumulated:"История накапливается",fallback:"Показаны последние сохранённые данные",stale:"Данные давно не обновлялись",
    period:"Статистика за",asof:"Данные на",captured:"Импортировано",unknown:"Часовой пояс отчёта не указан",history:"История подписчиков"},
  en: {followers:"Followers",views:"Views",likes:"Likes",comments:"Comments",shares:"Shares",profile_views:"Profile views",
    accumulated:"History is accumulating",fallback:"Showing last known good data",stale:"Data is out of date",
    period:"Statistics for",asof:"Data as of",captured:"Imported",unknown:"Report timezone unavailable",history:"Follower history"}
};

export function validateSchema(value, schema, path="$") {
  if ("const" in schema && value !== schema.const) throw Error(path+": const");
  if (schema.enum && !schema.enum.includes(value)) throw Error(path+": enum");
  if (schema.type) {
    const allowed=Array.isArray(schema.type)?schema.type:[schema.type];
    const actual=value===null?"null":Array.isArray(value)?"array":typeof value;
    if (!allowed.some(type=>type==="integer"?Number.isInteger(value):type==="object"?
        actual==="object" && value!==null:actual===type)) throw Error(path+": type");
  }
  if (typeof value==="number") {
    if (!Number.isFinite(value) || ("minimum" in schema && value<schema.minimum) ||
        ("maximum" in schema && value>schema.maximum)) throw Error(path+": number");
  }
  if (typeof value==="string") {
    if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) throw Error(path+": pattern");
    if (schema.format==="date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        new Date(value+"T00:00:00Z").toISOString().slice(0,10)!==value)) throw Error(path+": date");
    if (schema.format==="date-time" && (!/(?:Z|\+00:00)$/.test(value) ||
        !Number.isFinite(Date.parse(value)))) throw Error(path+": timestamp");
  }
  if (Array.isArray(value)) {
    if (("minItems" in schema && value.length<schema.minItems) ||
        ("maxItems" in schema && value.length>schema.maxItems)) throw Error(path+": items");
    value.forEach((item,index)=>validateSchema(item,schema.items,path+"["+index+"]"));
  } else if (value && typeof value==="object") {
    for (const key of schema.required||[]) if (!(key in value)) throw Error(path+": missing "+key);
    for (const key of Object.keys(value)) {
      if (!(key in (schema.properties||{}))) {
        if (schema.additionalProperties===false) throw Error(path+": extra "+key);
      } else validateSchema(value[key],schema.properties[key],path+"."+key);
    }
  }
}

export function validatePayload(payload,schema,expected) {
  validateSchema(payload,schema);
  if (payload.account_key!==expected.key || payload.username!==expected.username ||
      payload.media_kit_slug!==expected.slug) throw Error("Account mismatch");
  const p=payload.period;
  if ((Date.parse(p.period_end)-Date.parse(p.period_start))/86400000+1!==p.calendar_days)
    throw Error("Calendar period mismatch");
  if (p.source_timezone==="SOURCE_TIMEZONE_UNKNOWN" && p.normalized_timezone!==null)
    throw Error("Unknown timezone normalized");
  if(p.source_timezone!=="SOURCE_TIMEZONE_UNKNOWN" && p.normalized_timezone!==p.source_timezone)
    throw Error("Timezone mismatch");
  const generated=Date.parse(payload.generated_at),generatedDate=payload.generated_at.slice(0,10);
  for(const reading of [payload.current.followers,p,payload.audience,...Object.values(p.metrics)])
    if(Date.parse(reading.captured_at)>generated)throw Error("Future capture");
  if(p.period_end>generatedDate || payload.current.followers.as_of_date>generatedDate)
    throw Error("Future observation");
  for(const metric of Object.values(p.metrics))
    if(metric.period_start>metric.period_end)throw Error("Metric period mismatch");
  if (payload.current.followers.value<=0) throw Error("Followers sanity failure");
  for (const group of ["gender","age","geography"]) {
    const rows=payload.audience[group]||[];
    if(new Set(rows.map(r=>r.label)).size!==rows.length) throw Error("Duplicate buckets");
    const sum=rows.reduce((s,r)=>s+r.fraction,0);
    if(rows.length && (sum>1.015 || (group!=="geography" && sum<0.985))) throw Error("Distribution mismatch");
  }
  for(const group of ["followers","daily_series"]){
    const days=payload.history[group].map(r=>r.date);
    if(days.some((day,i)=>i>0 && day<=days[i-1]))throw Error("Unordered history");
  }
  return payload;
}

async function textFetch(url, timeoutMs) {
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetch(url,{signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw Error("HTTP "+response.status);
    const reader=response.body.getReader(), chunks=[];
    let size=0;
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;
      if(size>MAX_BYTES){await reader.cancel();throw Error("Payload exceeds limit");}
      chunks.push(value);
    }
    const bytes=new Uint8Array(size);
    let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return {bytes,text:new TextDecoder("utf-8",{fatal:true}).decode(bytes)};
  } finally {clearTimeout(timer);}
}

export async function loadManifest(url,schema,expected,timeoutMs=10000) {
  const manifest=JSON.parse((await textFetch(url,timeoutMs)).text);
  if(manifest.schema_version===3){
    validateSchema(manifest,activeManifestSchema);
    if(manifest.account_key!==expected.key||manifest.username!==expected.username||manifest.media_kit_slug!==expected.slug)
      throw Error('Manifest account mismatch');
    const canonicalBase='https://rytni.github.io/rytni-assets/data/media-kits/'+expected.key+'/releases/';
    if(manifest.release_id!==manifest.release_sha256||manifest.release_url!==canonicalBase+manifest.release_id+'.json')
      throw Error('Manifest target mismatch');
    const period=manifest.period;
    if((Date.parse(period.end)-Date.parse(period.start))/86400000+1!==period.days ||
       period.normalized_timezone!==(period.source_timezone==='SOURCE_TIMEZONE_UNKNOWN'?null:period.source_timezone))
      throw Error('Manifest period mismatch');
    let failure;
    for(const digest of [manifest.release_id,manifest.previous_release_id].filter(Boolean)){
      try{
        const result=await loadSnapshot(canonicalBase+digest+'.json',schema,expected,timeoutMs);
        if(digest===manifest.release_id){
          const p=result.payload.period;
          if(manifest.data_updated_at!==result.payload.freshness.data_as_of_date||period.start!==p.period_start||
             period.end!==p.period_end||period.days!==p.calendar_days||period.source_timezone!==p.source_timezone)
            throw Error('Manifest metadata differs from target');
        }
        return {...result,previous:digest!==manifest.release_id};
      }catch(error){failure=error;}
    }
    throw failure;
  }
  const allowed=["schema_version","account_key","username","media_kit_slug","current","previous"];
  if(Object.keys(manifest).sort().join()!==allowed.sort().join() || manifest.schema_version!==2 ||
     manifest.account_key!==expected.key || manifest.username!==expected.username ||
     manifest.media_kit_slug!==expected.slug || !/^[a-f0-9]{64}$/.test(manifest.current) ||
     (manifest.previous!==null && !/^[a-f0-9]{64}$/.test(manifest.previous)))throw Error("Manifest mismatch");
  const base=new URL(".",new URL(url,location.href));
  let failure;
  for(const digest of [manifest.current,manifest.previous].filter(Boolean)){
    try{
      const result=await textFetch(new URL("releases/"+digest+".json",base),timeoutMs);
      const hash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",result.bytes))]
        .map(v=>v.toString(16).padStart(2,"0")).join("");
      if(hash!==digest)throw Error("Checksum mismatch");
      return {payload:validatePayload(JSON.parse(result.text),schema,expected),previous:digest!==manifest.current};
    }catch(error){failure=error;}
  }
  throw failure;
}

export async function loadSnapshot(url,schema,expected,timeoutMs=10000) {
  const digest=new URL(url,location.href).pathname.match(/\/([a-f0-9]{64})\.json$/)?.[1];
  if(!digest)throw Error("Immutable snapshot URL requires SHA256 filename");
  const result=await textFetch(url,timeoutMs);
  const hash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",result.bytes))]
    .map(v=>v.toString(16).padStart(2,"0")).join("");
  if(hash!==digest)throw Error("Checksum mismatch");
  return {payload:validatePayload(JSON.parse(result.text),schema,expected),previous:false};
}

export function mountMediaKit({root,schema,expected,manifestUrl,snapshotUrl,bootstrap,language="ru",timeoutMs=10000,renderData}) {
  let lang=language,lkg=null,lastFailed=false;
  const cacheKey="rytni-media-kit-v2:"+expected.key+":"+expected.username+":"+expected.slug;
  const dateText=value=>new Intl.DateTimeFormat(lang==="en"?"en-GB":"ru-RU",
    {dateStyle:"long",timeZone:"UTC"}).format(new Date(value+"T00:00:00Z"));
  const status=root.querySelector("[data-mk-status]");
  function render(payload,failed=false){
    lastFailed=failed;
    if(renderData){renderData(payload,{language:lang,failed});return;}
    const words=labels[lang]||labels.ru;
    const readings={followers:payload.current.followers,...payload.period.metrics};
    for(const key of ["followers","views","likes","comments","shares","profile_views"]){
      const node=root.querySelector('[data-mk="'+key+'"]'),reading=readings[key];
      if(!node||!reading)continue; // Preserve existing HTML/LKG instead of zeroing.
      node.textContent=new Intl.NumberFormat(lang==="en"?"en-GB":"ru-RU",
        {notation:"compact",maximumFractionDigits:1}).format(reading.value);
      node.title=new Intl.NumberFormat(lang==="en"?"en-GB":"ru-RU").format(reading.value);
      root.querySelector('[data-mk-label="'+key+'"]').textContent=words[key];
      const metadata=root.querySelector('[data-mk-date="'+key+'"]');
      metadata.textContent=key==="followers"?words.asof+" "+dateText(reading.as_of_date):
        dateText(reading.period_start)+" — "+dateText(reading.period_end);
    }
    root.querySelector("[data-mk-period]").textContent=words.period+" "+
      dateText(payload.period.period_start)+" — "+dateText(payload.period.period_end);
    root.querySelector("[data-mk-updated]").textContent=words.asof+" "+dateText(payload.freshness.data_as_of_date);
    const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Minsk"}).format(new Date());
    const stale=(Date.parse(today)-Date.parse(payload.freshness.data_as_of_date))/86400000>payload.freshness.stale_after_days;
    status.textContent=[failed?words.fallback:"",stale?words.stale:"",
      payload.period.source_timezone==="SOURCE_TIMEZONE_UNKNOWN"?words.unknown:""].filter(Boolean).join(" · ");
    status.dataset.state=failed?"FALLBACK":stale?"STALE":"READY";
    followerChart(root.querySelector("[data-mk-chart]"),payload.history.followers,lang);
  }
  function accept(payload,failed=false){
    validatePayload(payload,schema,expected);lkg=payload;render(payload,failed);
    try{localStorage.setItem(cacheKey,JSON.stringify(payload));}catch{}
  }
  if(bootstrap)accept(bootstrap);
  try{
    const cached=JSON.parse(localStorage.getItem(cacheKey)||"null");
    if(cached){validatePayload(cached,schema,expected);if(!lkg||cached.generated_at>lkg.generated_at)accept(cached);}
  }catch{}
  async function refresh(){
    try{
      const {payload,previous}=await (snapshotUrl?loadSnapshot(snapshotUrl,schema,expected,timeoutMs):
        loadManifest(manifestUrl,schema,expected,timeoutMs));
      accept(payload,previous);return {status:previous?"PREVIOUS_RELEASE":"READY"};
    }catch{
      if(lkg)render(lkg,true);else{status.textContent=(labels[lang]||labels.ru).fallback;status.dataset.state="FALLBACK";}
      return {status:"FALLBACK"};
    }
  }
  return {refresh,setLanguage(value){lang=value==="en"?"en":"ru";if(lkg)render(lkg,lastFailed);}};
}

export const localeFor=lang=>lang==='en'?'en-GB':'ru-RU';
export const metricFormat=(value,key,lang)=>new Intl.NumberFormat('en-GB',{notation:'compact',maximumFractionDigits:value>=1000000?1:0}).format(value);
export const dateFormat=(value,lang)=>new Intl.DateTimeFormat(localeFor(lang),{dateStyle:'long',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
export const percentFormat=(fraction,lang)=>new Intl.NumberFormat(localeFor(lang),{style:'percent',maximumFractionDigits:1}).format(fraction);

export function audienceLabel(group,label,lang,words){
  if(group==='gender')return words[label]||label;
  if(group==='geography'){
    if(label==='OTHER')return words.otherCountries;
    try{return new Intl.DisplayNames([localeFor(lang)],{type:'region'}).of(label);}catch{return label;}
  }
  return label;
}
export function renderAudience(container,group,buckets,lang,words){
  container.replaceChildren();
  if(!buckets?.length){const note=document.createElement('p');note.className='note';note.textContent=words.unavailable;container.append(note);return;}
  for(const bucket of buckets){
    const row=document.createElement('div');row.className=container.classList.contains('rows')?'row':'aud-row';row.dataset.label=bucket.label;
    const label=document.createElement('span');label.textContent=audienceLabel(group,bucket.label,lang,words);
    const track=document.createElement('div');track.className=container.classList.contains('rows')?'bar':'track';track.setAttribute('role','meter');
    track.setAttribute('aria-label',label.textContent);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
    track.setAttribute('aria-valuenow',String(bucket.fraction*100));
    const value=document.createElement('b');value.textContent=percentFormat(bucket.fraction,lang);track.setAttribute('aria-valuetext',value.textContent);
    const fill=document.createElement('i');fill.style.width=(bucket.fraction*100)+'%';track.append(fill);
    row.append(label,track,value);container.append(row);
  }
}

// content is bundled from one versioned JSON dictionary shared with static rendering.
export function mountPremium({root,expected,manifestUrl,bootstrap,schema,timeoutMs=10000}){
  const langKey='rytni-media-kit-language:'+expected.key;
  let selected='ru';
  try{selected=new URL(location.href).searchParams.get('lang')||localStorage.getItem(langKey)||'ru';}catch{}
  selected=selected==='en'?'en':'ru';
  function render(payload,{language,failed}){
    const lang=language==='en'?'en':'ru',words=content.shared[lang],account=approvedCopy[expected.key];
    document.documentElement.lang=lang;root.dataset.language=lang;
    const aria=content.accessibility[lang];root.querySelector('nav').setAttribute('aria-label',aria.navigation);
    root.querySelector('.language').setAttribute('aria-label',aria.language);root.querySelector('.skip').textContent=aria.skip;
    root.querySelectorAll('[data-approved-copy]').forEach(node=>node.textContent=account.text[node.dataset.approvedCopy][lang]);
    root.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
    root.querySelector('[data-topics]').replaceChildren(...account.topics[lang].map(text=>{const span=document.createElement('span');span.className='pill';span.textContent=text;return span;}));
    const readings={followers:payload.current.followers,...payload.period.metrics};
    for(const key of ['followers','views','likes','comments','shares','profile_views']){
      if(!readings[key])continue;
      root.querySelectorAll('[data-mk="'+key+'"]').forEach(node=>{node.textContent=metricFormat(readings[key].value,key,lang);node.dataset.value=String(readings[key].value);node.title=new Intl.NumberFormat(localeFor(lang)).format(readings[key].value);node.setAttribute('aria-label',node.title);});
      root.querySelectorAll('[data-mk-date="'+key+'"]').forEach(node=>node.textContent=key==='followers'?(lang==='en'?'As of ':'На ')+dateFormat(readings[key].as_of_date,lang):readings[key].period_start+' — '+readings[key].period_end);
    }
    root.querySelectorAll('[data-mk-period]').forEach(node=>node.textContent=words.period+dateFormat(payload.period.period_start,lang)+' — '+dateFormat(payload.period.period_end,lang));
    root.querySelector('[data-mk-updated]').textContent=words.updated+dateFormat(payload.freshness.data_as_of_date,lang);
    for(const group of ['gender','age','geography'])renderAudience(root.querySelector('[data-audience="'+group+'"]'),group,payload.audience[group],lang,words);
    const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Minsk'}).format(new Date());
    const stale=(Date.parse(today)-Date.parse(payload.freshness.data_as_of_date))/86400000>payload.freshness.stale_after_days;
    const state=failed?'FALLBACK':stale?'STALE':'READY',status=root.querySelector('[data-mk-status]');
    status.dataset.state=state;status.textContent=failed?words.fallback:stale?words.stale:'';
    root.dataset.mkAccount=expected.key;root.dataset.mkDataAsOf=payload.freshness.data_as_of_date;root.dataset.state=state;
  }
  const adapter=mountMediaKit({root,schema,expected,manifestUrl,bootstrap,timeoutMs,renderData:render,language:selected});
  root.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>{
    const lang=button.dataset.lang;adapter.setLanguage(lang);
    try{localStorage.setItem(langKey,lang);const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);}catch{}
  }));
  root.dataset.state='LOADING';root.setAttribute('aria-busy','true');
  adapter.refresh().finally(()=>root.setAttribute('aria-busy','false'));
  return adapter;
}
