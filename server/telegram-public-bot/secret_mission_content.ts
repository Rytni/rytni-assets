export type SecretMissionFact = { game: string; fact: string; source: string };

export const SECRET_MISSION_INTROS = [
  "Секретный сигнал пойман. Заберите персональный бонус, пока канал открыт.",
  "Разведка нашла тайник. У вас десять минут, чтобы забрать награду.",
  "Система выбрала вас для быстрой миссии. Промедление сожжёт бонус.",
  "Редкое событие активировано. Нажмите кнопку до закрытия портала.",
  "Личный квест уже начался. Успейте получить награду раньше таймера.",
] as const;

const ZELDA="https://zelda.nintendo.com/about/";
const ZELDA_HISTORY="https://www.nintendo.com/jp/character/zelda/en/history/index.html";
const MARIO="https://mario.nintendo.com/characters/";
const KIRBY="https://kirby.nintendo.com/about/";
const SONIC="https://asia.sega.com/SonicOrigins/en/about/";
const SONIC_MANUAL="https://manuals.sega.com/origins/en/?pid=7";
const SONIC_LORE="https://sonic.sega.jp/SonicChannel/character/worldstory/";
const HALO="https://www.halowaypoint.com/news/the-new-halo-encyclopedia-is-out-today";
const HALO_INFINITE="https://www.halowaypoint.com/news/welcome-to-halo-infinite";
const GOD_OF_WAR="https://www.playstation.com/en-us/god-of-war";
const GHOST="https://www.playstation.com/en-us/games/ghost-of-tsushima/";
const OVERWATCH="https://overwatch.blizzard.com/en-us/";
const OVERWATCH_WORLD="https://overwatch.blizzard.com/en-us/news/20063489/";
const DRAGON_AGE="https://news.ea.com/press-releases/press-releases-details/2009/BioWare-Reveals-All-Six-Dragon-Age-Origin-Stories/default.aspx";
const DEAD_SPACE="https://www.ea.com/news/inside-dead-space-5-story-matters";

export const SECRET_MISSION_FACTS: SecretMissionFact[] = [
  {game:"The Legend of Zelda",fact:"Мир Хайрула, по древним сказаниям, создали три богини: Дин, Найру и Фарор.",source:ZELDA},
  {game:"The Legend of Zelda",fact:"Дин создала землю, Найру установила порядок, а Фарор создала жизнь.",source:ZELDA},
  {game:"The Legend of Zelda",fact:"Трифорс состоит из трёх золотых треугольников и способен исполнить желание.",source:ZELDA},
  {game:"The Legend of Zelda",fact:"Три части Трифорса связаны с силой, мудростью и храбростью.",source:ZELDA},
  {game:"The Legend of Zelda",fact:"Если владельцу не хватает равновесия трёх добродетелей, Трифорс раскалывается.",source:ZELDA},
  {game:"The Legend of Zelda",fact:"Ганондорф владеет Трифорсом силы, Зельда — мудрости, а Линк — храбрости.",source:ZELDA},
  {game:"The Legend of Zelda",fact:"После Ocarina of Time история Хайрула разделяется на несколько временных линий.",source:ZELDA},
  {game:"Majora’s Mask",fact:"Линк путешествует во времени, чтобы остановить падение Луны.",source:ZELDA},
  {game:"The Wind Waker",fact:"Линк отправляется в морское путешествие, чтобы спасти похищенную сестру Арилл.",source:ZELDA},
  {game:"Phantom Hourglass",fact:"Для победы над Беллумом Линку требуется выковать Призрачный меч.",source:ZELDA},
  {game:"Spirit Tracks",fact:"Линк и Зельда расследуют таинственное исчезновение железнодорожных путей.",source:ZELDA},
  {game:"Skyward Sword",fact:"Люди жили на острове в небе и летали на огромных птицах Лофтвингах.",source:ZELDA_HISTORY},
  {game:"Skyward Sword",fact:"Фай — дух меча, который направляет Линка к земле под облаками.",source:ZELDA_HISTORY},
  {game:"The Minish Cap",fact:"Крошечный народ Пикори однажды спустился с неба, чтобы помочь миру.",source:ZELDA_HISTORY},
  {game:"Four Swords",fact:"Легендарный Четыре Меча способен разделить героя на четыре версии.",source:ZELDA_HISTORY},
  {game:"Ocarina of Time",fact:"Кокири остаются детьми и не стареют.",source:ZELDA_HISTORY},
  {game:"Ocarina of Time",fact:"Линк узнаёт от Великого Древа Деку, что на самом деле он хилианец.",source:ZELDA_HISTORY},
  {game:"A Link to the Past",fact:"Семь мудрецов запечатали вход в Священное царство во время Войны заточения.",source:ZELDA_HISTORY},
  {game:"Oracle of Seasons",fact:"Похищение оракула Дин нарушило естественную смену времён года.",source:ZELDA_HISTORY},
  {game:"Oracle of Ages",fact:"Веран завладела оракулом Найру, управлявшей временем.",source:ZELDA_HISTORY},
  {game:"A Link Between Worlds",fact:"Браслет Равио позволяет Линку превращаться в рисунок и двигаться по стенам.",source:ZELDA_HISTORY},
  {game:"A Link Between Worlds",fact:"Лорул — параллельное измерение, противопоставленное Хайрулу.",source:ZELDA_HISTORY},
  {game:"Echoes of Wisdom",fact:"После исчезновения Линка спасать Хайрул отправляется сама принцесса Зельда.",source:ZELDA_HISTORY},
  {game:"The Legend of Zelda",fact:"Зельда разделила Трифорс мудрости на восемь частей, чтобы спрятать его от Ганона.",source:ZELDA_HISTORY},
  {game:"Link’s Awakening",fact:"Кораблекрушение выбросило Линка на остров Кохолинт.",source:ZELDA_HISTORY},

  {game:"Super Mario",fact:"По профессии Марио сантехник, хотя официально его называют мастером на все руки.",source:MARIO},
  {game:"Super Mario",fact:"Луиджи выше Марио и способен прыгать выше брата.",source:MARIO},
  {game:"Super Mario",fact:"Форма усов Луиджи отличается от усов Марио.",source:MARIO},
  {game:"Super Mario",fact:"Принцесса Пич любит не только спорт, но также выпечку и готовку.",source:MARIO},
  {game:"Super Mario",fact:"У Тоада красные пятна, но представители его народа бывают разных цветов.",source:MARIO},
  {game:"Super Mario",fact:"Боузер правит Купами и способен извергать огонь.",source:MARIO},
  {game:"Super Mario",fact:"Йоши превращает проглоченные фрукты и врагов в яйца для метания.",source:MARIO},
  {game:"Super Mario",fact:"Дейзи — принцесса королевства Сарасаленд.",source:MARIO},
  {game:"Super Mario",fact:"Варио любит чеснок и деньги.",source:MARIO},
  {game:"Super Mario",fact:"Валуиджи считает себя соперником Луиджи.",source:MARIO},
  {game:"Super Mario Galaxy",fact:"Розалина путешествует по галактике вместе со звёздными существами Люма.",source:MARIO},
  {game:"Super Mario",fact:"Розалина считается приёмной матерью Люма.",source:MARIO},
  {game:"Super Mario",fact:"Боузер-младший — единственный сын Боузера.",source:MARIO},
  {game:"Super Mario",fact:"Призраки Бу замирают и закрывают глаза, когда на них смотрят.",source:MARIO},
  {game:"Donkey Kong",fact:"Красный галстук Донки Конга украшен его инициалами.",source:MARIO},
  {game:"Donkey Kong",fact:"Дидди слабее Донки Конга, зато быстрее и проворнее.",source:MARIO},

  {game:"Kirby",fact:"Рост Кирби — всего около восьми дюймов.",source:KIRBY},
  {game:"Kirby",fact:"Кирби живёт на планете Попстар и умеет поглощать врагов.",source:KIRBY},
  {game:"Kirby",fact:"Вэддл Ди — самые распространённые жители Страны снов.",source:KIRBY},
  {game:"Kirby",fact:"Король Дидиди сам провозгласил себя королём Страны снов.",source:KIRBY},
  {game:"Kirby",fact:"Дидиди порой помогает Кирби, хотя обычно считается его заклятым другом-соперником.",source:KIRBY},

  {game:"Sonic the Hedgehog",fact:"Первая игра о Сонике вышла в Японии 26 июля 1991 года.",source:SONIC},
  {game:"Sonic the Hedgehog",fact:"Соник защищает животных и Изумруды Хаоса от доктора Эггмана.",source:SONIC},
  {game:"Sonic CD",fact:"Sonic CD позволяет перемещаться между прошлым и будущим.",source:SONIC},
  {game:"Sonic CD",fact:"Эми Роуз и Метал Соник впервые появились именно в Sonic CD.",source:SONIC},
  {game:"Sonic CD",fact:"При дебюте Эми носила прозвище Рози-Проныра.",source:SONIC},
  {game:"Sonic the Hedgehog 2",fact:"Тейлз впервые появился в Sonic the Hedgehog 2.",source:SONIC},
  {game:"Sonic the Hedgehog 2",fact:"В игре можно было соревноваться на разделённом экране.",source:SONIC},
  {game:"Sonic 3 & Knuckles",fact:"Sonic 3 и Sonic & Knuckles изначально вышли двумя отдельными частями.",source:SONIC},
  {game:"Sonic 3 & Knuckles",fact:"Наклз дебютировал как красный соперник Соника.",source:SONIC},
  {game:"Sonic",fact:"Тейлз летает, вращая два хвоста подобно винту вертолёта.",source:SONIC_MANUAL},
  {game:"Sonic",fact:"Наклз охраняет Мастер-Изумруд.",source:SONIC_MANUAL},
  {game:"Sonic",fact:"Эми увлекается гаданием на картах и владеет молотом Пико-Пико.",source:SONIC_MANUAL},
  {game:"Sonic",fact:"Метал Соника создал Эггман, чтобы сравняться с Соником в скорости и силе.",source:SONIC_MANUAL},
  {game:"Sonic",fact:"Соник любит свободу, не терпит несправедливость и помогает попавшим в беду.",source:SONIC_MANUAL},
  {game:"Sonic",fact:"Древние прибыли на Землю с Изумрудами Хаоса из космоса.",source:SONIC_LORE},
  {game:"Sonic",fact:"Потомки части древнего народа со временем превратились в Чао.",source:SONIC_LORE},
  {game:"Sonic",fact:"Тёмная Гайя циклически разрушает Землю, а Светлая Гайя исцеляет её.",source:SONIC_LORE},
  {game:"Sonic",fact:"Предки Вавилонских воров были пришельцами, потерпевшими крушение на Земле.",source:SONIC_LORE},
  {game:"Sonic",fact:"Шэдоу был создан с использованием ДНК Блэк Дума.",source:SONIC_LORE},
  {game:"Sonic Adventure",fact:"Хаос был освобождён из Мастер-Изумруда доктором Эггманом.",source:SONIC_LORE},

  {game:"Halo",fact:"Массив Halo состоит из семи кольцевых установок.",source:HALO},
  {game:"Halo",fact:"Активация колец Halo способна уничтожить всю разумную жизнь в галактике.",source:HALO},
  {game:"Halo",fact:"В XXVI веке Земля остаётся центром управления человечеством.",source:HALO},
  {game:"Halo",fact:"Экумена — совокупность миров, которыми управляли Предтечи.",source:HALO},
  {game:"Halo",fact:"Совет Экумены включал не менее пятисот представителей Предтеч.",source:HALO},
  {game:"Halo",fact:"Бруты в лоре называются Джиралханае.",source:HALO},
  {game:"Halo",fact:"Шакалы и Скирмишеры принадлежат к виду Киг-Яр.",source:HALO},
  {game:"Halo",fact:"Хурагоки, известные как Инженеры, созданы для технической работы.",source:HALO},
  {game:"Halo",fact:"Сущность у Предтеч — это архив разума и личности.",source:HALO},
  {game:"Halo",fact:"Прометейским Рыцарем управляет преобразованная сущность воина.",source:HALO},
  {game:"Halo",fact:"Ключ-корабли помогали каталогизировать разумные виды в конце войны с Потопом.",source:HALO},
  {game:"Halo Infinite",fact:"Действие кампании разворачивается на загадочном кольце Зета Halo.",source:HALO_INFINITE},
  {game:"Halo Infinite",fact:"Зета Halo стала крупнейшим пространством кампании в серии на момент выхода.",source:HALO_INFINITE},
  {game:"Halo Infinite",fact:"Освобождённые передовые базы позволяют заказывать оружие и транспорт.",source:HALO_INFINITE},
  {game:"Halo Infinite",fact:"Академией спартанцев руководит командир Агрина.",source:HALO_INFINITE},

  {game:"God of War",fact:"Серия God of War началась на PlayStation 2 в 2005 году.",source:GOD_OF_WAR},
  {game:"God of War Ragnarök",fact:"Кратос и Атрей путешествуют по Девяти мирам перед наступлением Рагнарёка.",source:GOD_OF_WAR},
  {game:"God of War",fact:"К известному оружию Кратоса относятся топор Левиафан и Клинки Хаоса.",source:GOD_OF_WAR},
  {game:"Ghost of Tsushima",fact:"Дзин начинает путь самураем, но постепенно создаёт образ Призрака.",source:GHOST},
  {game:"Ghost of Tsushima",fact:"В бою можно сочетать катану, лук и скрытные приёмы.",source:GHOST},
  {game:"Ghost of Tsushima",fact:"Дополнительная история Director’s Cut разворачивается на острове Ики.",source:GHOST},
  {game:"Overwatch",fact:"Матчи Overwatch построены вокруг командных сражений пять на пять.",source:OVERWATCH},
  {game:"Overwatch",fact:"Мир Overwatch изображает оптимистичное будущее.",source:OVERWATCH},
  {game:"Overwatch",fact:"Истории героев раскрываются не только в игре, но и в мультфильмах и цифровых комиксах.",source:OVERWATCH_WORLD},
  {game:"Dragon Age: Origins",fact:"Игра предлагает шесть разных историй происхождения героя.",source:DRAGON_AGE},
  {game:"Dragon Age: Origins",fact:"Выбранное происхождение меняет начальные места, персонажей и события.",source:DRAGON_AGE},
  {game:"Dragon Age: Origins",fact:"Долийский эльф начинает историю как один из последних «истинных эльфов» своего народа.",source:DRAGON_AGE},
  {game:"Dead Space",fact:"История Айзека строится вокруг спуска в кошмар ради спасения любимого человека.",source:DEAD_SPACE},
  {game:"Dead Space",fact:"Ремейк расширил детали лора ради связи с книгами, комиксами и другими историями вселенной.",source:DEAD_SPACE},
  {game:"Dead Space",fact:"Одна из центральных тем Dead Space — конфликт между разобщением и воссоединением.",source:DEAD_SPACE},
  {game:"Halo",fact:"Десантная капсула доставляет бойцов с орбиты прямо на поверхность планеты.",source:HALO},
  {game:"Halo",fact:"Энергетический щит создаётся сетью перекрывающихся силовых полей.",source:HALO},
  {game:"Halo",fact:"Предтечи называли Землю именем Эрде-Тирене.",source:HALO},
  {game:"Halo",fact:"Джиралханае отличаются огромной физической силой и занимают важное место среди Изгнанников.",source:HALO},
];

if (SECRET_MISSION_FACTS.length !== 100) throw new Error(`secret_mission_fact_count:${SECRET_MISSION_FACTS.length}`);
