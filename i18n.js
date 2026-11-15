/*
 * VULKAN internationalisation: English, Russian, Uzbek (Latin).
 * - E.t(key, vars) returns an interface string in the current language.
 * - E.setLang(lang) swaps the curated content (investigations, insights, gaps…)
 *   for its translation from E.L10N[lang], falling back to English per field.
 * Numbers, ids, units and NASA source titles stay unchanged.
 */
(function () {
  const E = (window.VULKAN = window.VULKAN || {});
  E.LANGS = { en: "EN", ru: "RU", uz: "UZ" };
  E.LANG_NAMES = { en: "English", ru: "Russian", uz: "Uzbek" };

  // key: [English, Russian, Uzbek]
  const UI = {
    "brand.sub": ["Fire-safety insights from NASA microgravity combustion data", "Пожарная безопасность на основе данных NASA о горении в микрогравитации", "NASA mikrogravitatsiya yonish ma'lumotlari asosida yong'in xavfsizligi"],
    "top.mission": ["Mission", "Миссия", "Missiya"],
    "top.theme": ["Toggle light or dark theme", "Светлая или тёмная тема", "Yorug' yoki qorong'i mavzu"],
    "top.lang": ["Interface language", "Язык интерфейса", "Interfeys tili"],
    "top.source": ["Source", "Источник", "Manba"],
    "tab.overview": ["Overview", "Обзор", "Umumiy ko'rinish"],
    "tab.atlas": ["Investigation Atlas", "Атлас исследований", "Tadqiqotlar atlasi"],
    "tab.map": ["Flammability Map", "Карта горючести", "Yonuvchanlik xaritasi"],
    "tab.risk": ["Fire Risk Explorer", "Оценка пожарного риска", "Yong'in xavfi tahlili"],
    "tab.rank": ["Mission Ranker", "Рейтинг для миссии", "Missiya reytingi"],
    "tab.ask": ["Ask VULKAN", "Спросить VULKAN", "VULKAN'dan so'rash"],
    "tabs.overview": ["Home", "Главная", "Asosiy"],
    "tabs.atlas": ["Atlas", "Атлас", "Atlas"],
    "tabs.map": ["Map", "Карта", "Xarita"],
    "tabs.risk": ["Risk", "Риск", "Xavf"],
    "tabs.rank": ["Ranker", "Рейтинг", "Reyting"],
    "tabs.ask": ["Ask", "Вопрос", "So'rash"],
    "tab.gaps": ["Gaps & Earth", "Пробелы и Земля", "Bo'shliqlar va Yer"],
    "tabs.gaps": ["Gaps", "Пробелы", "Bo'shliq"],
    "footer.1": ["Built for the NASA Space Apps Challenge 2026, “Flame in Freefall”. Data curated from public NASA sources: the PSI Data Repository, NASA Glenn Combustion Science, NASA investigation fact sheets and <em>A Researcher's Guide to ISS Combustion Science</em>. Each record links to its source.", "Создано для NASA Space Apps Challenge 2026, задача «Flame in Freefall». Данные отобраны из открытых источников NASA: репозиторий PSI, NASA Glenn Combustion Science, информационные листы экспериментов и <em>A Researcher's Guide to ISS Combustion Science</em>. Каждая запись ссылается на свой источник.", "NASA Space Apps Challenge 2026, “Flame in Freefall” musobaqasi uchun yaratilgan. Ma'lumotlar NASA'ning ochiq manbalaridan olingan: PSI repozitoriysi, NASA Glenn Combustion Science, tajribalar ma'lumotnomalari va <em>A Researcher's Guide to ISS Combustion Science</em>. Har bir yozuv o'z manbasiga havola qiladi."],
    "footer.2": ["The Fire Risk Explorer is a transparent, physics-informed screening model for exploring trends. It is not a substitute for NASA-STD-6001 material certification.", "Оценка пожарного риска — прозрачная физическая модель для изучения тенденций. Она не заменяет сертификацию материалов по NASA-STD-6001.", "Yong'in xavfi tahlili tendensiyalarni o'rganish uchun ochiq, fizikaga asoslangan model. U NASA-STD-6001 bo'yicha materiallarni sertifikatlashning o'rnini bosmaydi."],
    "footer.3": ["AI use: the code was written with help from Anthropic's Claude and reviewed by the team. Ask VULKAN answers are AI-generated from the cited NASA sources, and spoken answers use an AI-generated voice (OpenAI text-to-speech) or your browser's voice. No NASA logos or branding are used.", "Использование ИИ: код написан с помощью Claude (Anthropic) и проверен командой. Ответы «Спросить VULKAN» генерируются ИИ на основе указанных источников NASA, а ответы вслух озвучивает синтетический голос ИИ (OpenAI text-to-speech) или голос вашего браузера. Логотипы и символика NASA не используются.", "Sun'iy intellektdan foydalanish: kod Anthropic'ning Claude yordamida yozilgan va jamoa tomonidan tekshirilgan. VULKAN javoblarini sun'iy intellekt ko'rsatilgan NASA manbalari asosida yaratadi, ovozli javoblarni esa sun'iy intellekt ovozi (OpenAI text-to-speech) yoki brauzeringiz ovozi o'qiydi. NASA logotiplari va ramzlari ishlatilmagan."],
    "ug": ["µg", "µg", "µg"],
    "u.kpa": ["kPa", "кПа", "kPa"],
    "u.cms": ["cm/s", "см/с", "sm/s"],
    "u.cm": ["cm", "см", "sm"],
    "top.home": ["VULKAN home", "VULKAN, главная", "VULKAN bosh sahifa"],
    "top.sections": ["Sections", "Разделы", "Bo'limlar"],
    "dr.closeAria": ["Close", "Закрыть", "Yopish"],

    // overview
    "ov.eyebrow": ["NASA Space Apps 2026 · Flame in Freefall", "NASA Space Apps 2026 · Flame in Freefall", "NASA Space Apps 2026 · Flame in Freefall"],
    "ov.h1": ["Fire behaves differently in space. <em>VULKAN</em> shows what that means for the Moon and Mars.", "В космосе огонь ведёт себя иначе. <em>VULKAN</em> показывает, что это значит для Луны и Марса.", "Koinotda olov boshqacha yonadi. <em>VULKAN</em> buning Oy va Mars uchun ma'nosini ko'rsatadi."],
    "ov.lede": ["{n} NASA microgravity fire experiments in one place, ranked for your mission. See what can burn, where the flight data runs out, and what to do about it, with a NASA source behind every answer.", "{n} экспериментов NASA с огнём в микрогравитации в одном месте, отсортированных под вашу миссию. Узнайте, что может гореть, где заканчиваются лётные данные и что делать, и у каждого ответа есть источник NASA.", "NASA'ning mikrogravitatsiyadagi {n} ta yong'in tajribasi bir joyda, missiyangiz uchun saralangan. Nima yonishi mumkinligini, parvoz ma'lumotlari qayerda tugashini va nima qilish kerakligini bilib oling. Har bir javob ortida NASA manbasi bor."],
    "ov.stepsTitle": ["How to use VULKAN", "Как пользоваться VULKAN", "VULKAN'dan qanday foydalanish"],
    "ov.s1t": ["Choose your mission", "Выберите миссию", "Missiyani tanlang"],
    "ov.s1d": ["ISS, lunar habitat, rover, Mars or spacesuit. Every view adapts to its air and gravity.", "МКС, лунная база, ровер, Марс или скафандр. Все разделы подстраиваются под её атмосферу и гравитацию.", "XKS, Oy bazasi, rover, Mars yoki skafandr. Barcha bo'limlar uning havosi va gravitatsiyasiga moslashadi."],
    "ov.s2t": ["Check a material", "Проверьте материал", "Materialni tekshiring"],
    "ov.s2d": ["Move the oxygen, pressure and airflow sliders and see if a flame can spread.", "Двигайте ползунки кислорода, давления и потока воздуха и смотрите, может ли распространиться пламя.", "Kislorod, bosim va havo oqimi slayderlarini suring va alanga tarqala oladimi, ko'ring."],
    "ov.s3t": ["Ask a question", "Задайте вопрос", "Savol bering"],
    "ov.s3d": ["Type or say “Hey Vulkan”. Answers cite NASA studies and flag missing data.", "Напишите или скажите «Эй, Вулкан». Ответы ссылаются на исследования NASA и отмечают нехватку данных.", "Yozing yoki “Hey Vulkan” deng. Javoblar NASA tadqiqotlariga tayanadi va yetishmayotgan ma'lumotni belgilaydi."],
    "ov.btnRisk": ["Explore fire risk for {s}", "Оценить риск пожара: {s}", "Yong'in xavfini baholash: {s}"],
    "ov.btnAsk": ["Ask VULKAN", "Спросить VULKAN", "VULKAN'dan so'rash"],
    "ov.btnMap": ["See the evidence map", "Открыть карту данных", "Dalillar xaritasini ko'rish"],
    "ov.flame1": ["1 g · buoyancy pulls air up<br>tall, yellow, sooty", "1 g · подъёмная сила тянет воздух вверх<br>высокое, жёлтое, коптящее", "1 g · ko'tarilish kuchi havoni yuqoriga tortadi<br>baland, sariq, qurumli"],
    "ov.flame2": ["Microgravity · diffusion only<br>dim blue sphere", "Микрогравитация · только диффузия<br>тусклая голубая сфера", "Mikrogravitatsiya · faqat diffuziya<br>xira ko'k shar"],
    "ov.flame1Aria": ["Candle flame in normal gravity: tall, yellow, sooty", "Пламя свечи при обычной гравитации: высокое, жёлтое, коптящее", "Oddiy gravitatsiyada sham alangasi: baland, sariq, qurumli"],
    "ov.flame2Aria": ["Candle flame in microgravity: dim blue sphere", "Пламя свечи в микрогравитации: тусклая голубая сфера", "Mikrogravitatsiyada sham alangasi: xira ko'k shar"],
    "footer.offline": ["Works offline: after your first visit VULKAN opens and answers with no network, and you can install it like an app.", "Работает без интернета: после первого визита VULKAN открывается и отвечает без сети, и его можно установить как приложение.", "Internetsiz ishlaydi: birinchi tashrifdan keyin VULKAN tarmoqsiz ochiladi va javob beradi, uni ilova kabi o'rnatish ham mumkin."],
    "footer.install": ["Install VULKAN", "Установить VULKAN", "VULKAN'ni o'rnatish"],
    "gl.title": ["The evidence gap in one line", "Пробел в данных одной строкой", "Ma'lumotdagi bo'shliq bir qatorda"],
    "gl.iss": ["tested ISS air (21% O₂, 1 atm)", "испытывали воздух МКС (21% O₂, 1 атм)", "XKS havosida sinalgan (21% O₂, 1 atm)"],
    "gl.moon": ["tested the oxygen-rich air planned for Moon bases (30–34% O₂ at 8.2–10.2 psia)", "испытывали богатый кислородом воздух лунных баз (30–34% O₂ при 8,2–10,2 psia)", "Oy bazalari uchun rejalashtirilgan kislorodga boy havoda sinalgan (30–34% O₂, 8,2–10,2 psia)"],
    "gl.grav": ["tested at Moon or Mars gravity", "проводились при лунной или марсианской гравитации", "Oy yoki Mars gravitatsiyasida sinalgan"],
    "gl.note": ["Out of the {n} NASA solid-material fire investigations flown in orbit ({names}), counted from each one's tested oxygen and pressure range.", "Из {n} исследований NASA по горению твёрдых материалов на орбите ({names}), по диапазонам кислорода и давления каждого.", "Orbitada o'tkazilgan NASA'ning qattiq materiallar yonishi bo'yicha {n} ta tadqiqotidan ({names}), har birining sinalgan kislorod va bosim oralig'i bo'yicha hisoblangan."],
    "gl.map": ["See the map", "Открыть карту", "Xaritani ko'rish"],
    "ov.kpi1": ["investigations curated ({f} flown, {p} planned)", "исследований в атласе ({f} проведено, {p} запланировано)", "tadqiqot jamlangan ({f} ta o'tkazilgan, {p} ta rejalashtirilgan)"],
    "ov.kpi2": ["years of flight experiments", "годы лётных экспериментов", "parvoz tajribalari yillari"],
    "ov.kpi3": ["test points across the record", "тестовых точек во всех данных", "barcha ma'lumotlardagi sinov nuqtalari"],
    "ov.kpi4": ["oxygen range tested (CFI-G reaches 85%)", "диапазон кислорода в тестах (CFI-G до 85%)", "sinovdagi kislorod oralig'i (CFI-G 85% gacha)"],
    "ov.insights": ["Top fire-safety insights", "Главные выводы по пожарной безопасности", "Yong'in xavfsizligi bo'yicha asosiy xulosalar"],
    "ov.rankedBy": ["Ranked by mission impact", "По влиянию на миссию", "Missiyaga ta'siri bo'yicha"],
    "ov.mostRel": ["Most relevant for {s}", "Наиболее важное для: {s}", "Eng muhimlari: {s}"],
    "ov.rankerLink": ["Ranker →", "Рейтинг →", "Reyting →"],
    "ov.evidence": ["Where the evidence is", "Где есть данные", "Dalillar qayerda"],
    "ov.byType": ["Investigations by type", "Исследования по типам", "Tadqiqotlar turlari bo'yicha"],
    "ov.evNote": ["Most flight data sits at 21% O₂ and 1 atm. Open the Flammability Map to see the gap around exploration atmospheres.", "Большинство лётных данных получено при 21% O₂ и 1 атм. Откройте карту горючести, чтобы увидеть пробел в области атмосфер для освоения космоса.", "Parvoz ma'lumotlarining aksariyati 21% O₂ va 1 atm'da olingan. Kelajak missiyalari atmosferasi atrofidagi bo'shliqni ko'rish uchun Yonuvchanlik xaritasini oching."],
    "ov.timeline": ["From accidents to experiments", "От аварий к экспериментам", "Halokatlardan tajribalargacha"],
    "ov.source": ["source", "источник", "manba"],
    "ov.action": ["Action:", "Действие:", "Tavsiya:"],
    "tag.prevention": ["prevention", "профилактика", "oldini olish"],
    "tag.materials": ["materials", "материалы", "materiallar"],
    "tag.habitat": ["habitat", "жилой модуль", "yashash moduli"],
    "tag.suppression": ["suppression", "тушение", "o'chirish"],
    "tag.procedures": ["procedures", "процедуры", "tartib-qoidalar"],
    "tag.detection": ["detection", "обнаружение", "aniqlash"],
    "tag.cleanup": ["cleanup", "очистка", "tozalash"],
    "tag.gap": ["gap", "пробел", "bo'shliq"],

    // atlas
    "at.title": ["Investigation Atlas", "Атлас исследований", "Tadqiqotlar atlasi"],
    "at.desc": ["Every curated NASA combustion investigation with its objective, fuels, test conditions, diagnostics and findings. Search, filter, open a record, or pick up to three to compare side by side.", "Все отобранные исследования горения NASA: цели, топливо, условия испытаний, диагностика и результаты. Ищите, фильтруйте, открывайте запись или выберите до трёх для сравнения.", "NASA'ning barcha yonish tadqiqotlari: maqsadi, yoqilg'isi, sinov sharoitlari, o'lchov asboblari va natijalari. Qidiring, saralang, yozuvni oching yoki taqqoslash uchun uchtagacha tanlang."],
    "at.search": ["Search fuels, sensors, findings… e.g. Nomex, soot, CO2, smoke", "Поиск по топливу, датчикам, результатам… напр. Nomex, сажа, CO2, дым", "Yoqilg'i, sensor, natija bo'yicha qidiruv… masalan Nomex, qurum, CO2, tutun"],
    "at.searchAria": ["Search investigations", "Поиск исследований", "Tadqiqotlarni qidirish"],
    "at.sortAria": ["Sort", "Сортировка", "Saralash"],
    "at.sortRel": ["Sort: relevance to mission", "Сортировка: важность для миссии", "Saralash: missiya uchun muhimligi"],
    "at.sortYear": ["Sort: newest first", "Сортировка: сначала новые", "Saralash: avval yangilari"],
    "at.sortO2": ["Sort: highest O₂ tested", "Сортировка: макс. O₂ в тестах", "Saralash: eng yuqori O₂"],
    "at.sortName": ["Sort: name", "Сортировка: по названию", "Saralash: nomi bo'yicha"],
    "at.open": ["Open {name}", "Открыть {name}", "{name} ni ochish"],
    "at.relTitle": ["Relevance to current mission", "Важность для текущей миссии", "Joriy missiya uchun muhimligi"],
    "at.planned": ["planned", "запланировано", "rejalashtirilgan"],
    "at.o2": ["O₂", "O₂", "O₂"],
    "at.pressure": ["Pressure", "Давление", "Bosim"],
    "at.flow": ["Flow", "Поток", "Oqim"],
    "at.compare": ["Compare", "Сравнить", "Taqqoslash"],
    "at.noMatch": ["No investigation matches “{q}”. Try a fuel (heptane, PMMA), a sensor (radiometer) or a hazard (smoke).", "Нет исследований по запросу «{q}». Попробуйте топливо (гептан, PMMA), датчик (радиометр) или опасность (дым).", "“{q}” bo'yicha tadqiqot topilmadi. Yoqilg'i (geptan, PMMA), sensor (radiometr) yoki xavf (tutun) nomini yozib ko'ring."],
    "at.selected": ["{n}/3 selected:", "Выбрано {n}/3:", "{n}/3 tanlandi:"],
    "at.clear": ["Clear", "Очистить", "Tozalash"],
    "cmp.title": ["Compare investigations", "Сравнение исследований", "Tadqiqotlarni taqqoslash"],
    "cmp.shared": ["Shared", "Общее", "Umumiy"],
    "cmp.different": ["Different", "Различия", "Farqli"],
    "cmp.none": ["none", "нет", "yo'q"],
    "cmp.hardware": ["hardware", "оборудование", "uskuna"],
    "cmp.fireType": ["fire type", "тип горения", "yonish turi"],
    "cmp.o2range": ["oxygen range", "диапазон кислорода", "kislorod oralig'i"],
    "cmp.type": ["Type", "Тип", "Turi"],
    "cmp.years": ["Years", "Годы", "Yillar"],
    "cmp.largest": ["Largest sample", "Крупнейший образец", "Eng katta namuna"],
    "cmp.keyFinding": ["Key finding", "Главный результат", "Asosiy natija"],
    "cmp.relevance": ["Relevance to {s}", "Важность для: {s}", "Muhimligi: {s}"],

    // drawer
    "dr.close": ["✕ Close", "✕ Закрыть", "✕ Yopish"],
    "dr.platform": ["Platform", "Платформа", "Platforma"],
    "dr.team": ["Team", "Команда", "Jamoa"],
    "dr.fuels": ["Fuels / samples", "Топливо / образцы", "Yoqilg'i / namunalar"],
    "dr.oxygen": ["Oxygen", "Кислород", "Kislorod"],
    "dr.pressure": ["Pressure", "Давление", "Bosim"],
    "dr.flow": ["Flow", "Поток", "Oqim"],
    "dr.diluents": ["Diluents", "Разбавители", "Suyultiruvchilar"],
    "dr.diagnostics": ["Diagnostics", "Диагностика", "O'lchov asboblari"],
    "dr.tests": ["Tests", "Тесты", "Sinovlar"],
    "dr.inProgress": ["in progress", "в процессе", "davom etmoqda"],
    "dr.approx": ["Values marked ≈ are curator estimates where the NASA source gives no explicit range.", "Значения со знаком ≈ — оценки составителя там, где источник NASA не указывает точный диапазон.", "≈ belgili qiymatlar NASA manbasida aniq oraliq berilmagan joylarda tuzuvchi bahosidir."],
    "dr.findings": ["Findings", "Результаты", "Natijalar"],
    "dr.implications": ["Fire-safety implications", "Значение для пожарной безопасности", "Yong'in xavfsizligi uchun ahamiyati"],
    "dr.notFocus": ["Not a primary focus.", "Не основной фокус.", "Asosiy yo'nalish emas."],
    "dr.meansFor": ["What it means for {s}", "Что это значит для: {s}", "Bu nimani anglatadi: {s}"],
    "dr.relevance": ["relevance", "важность", "muhimlik"],
    "dr.generating": ["Generating interpretation…", "Готовим интерпретацию…", "Talqin tayyorlanmoqda…"],
    "dr.sources": ["Sources", "Источники", "Manbalar"],
    "layer.prevention": ["Prevention", "Профилактика", "Oldini olish"],
    "layer.detection": ["Detection", "Обнаружение", "Aniqlash"],
    "layer.suppression": ["Suppression", "Тушение", "O'chirish"],
    "eng.offline": ["VULKAN offline reasoner", "Офлайн-модуль VULKAN", "VULKAN oflayn tahlilchisi"],
    "eng.claude": ["Claude", "Claude", "Claude"],
    "eng.confidence": ["confidence", "достоверность", "ishonchlilik"],

    // map
    "map.title": ["Flammability Map", "Карта горючести", "Yonuvchanlik xaritasi"],
    "map.desc": ["Each box is the oxygen and pressure range an investigation tested. Diamonds are real and planned spacecraft atmospheres. The pulsing ring is your mission: <strong>{s}</strong>. Click any box to open its record.", "Каждый прямоугольник — диапазон кислорода и давления, проверенный в исследовании. Ромбы — реальные и планируемые атмосферы кораблей. Пульсирующее кольцо — ваша миссия: <strong>{s}</strong>. Нажмите на прямоугольник, чтобы открыть запись.", "Har bir to'rtburchak tadqiqotda sinalgan kislorod va bosim oralig'i. Romblar haqiqiy va rejalashtirilgan kema atmosferalari. Pulslanuvchi halqa sizning missiyangiz: <strong>{s}</strong>. Yozuvni ochish uchun to'rtburchakni bosing."],
    "map.xAxis": ["Total pressure, kPa (log scale) · 101.3 kPa = 1 atm = 14.7 psia", "Общее давление, кПа (лог. шкала) · 101,3 кПа = 1 атм = 14,7 psia", "Umumiy bosim, kPa (log shkala) · 101,3 kPa = 1 atm = 14,7 psia"],
    "map.yAxis": ["Oxygen concentration, % by volume", "Концентрация кислорода, % по объёму", "Kislorod konsentratsiyasi, hajm bo'yicha %"],
    "map.dashed": ["dashed: sea-level O₂ partial pressure (21.3 kPa)", "пунктир: парциальное давление O₂ на уровне моря (21,3 кПа)", "punktir: dengiz sathidagi O₂ parsial bosimi (21,3 kPa)"],
    "map.cluster": ["{n} investigations tested here", "{n} исследований здесь", "bu yerda {n} ta tadqiqot"],
    "map.legAtm": ["Spacecraft atmosphere", "Атмосфера корабля", "Kema atmosferasi"],
    "map.legAcc": ["Historic accident", "Историческая авария", "Tarixiy halokat"],
    "map.legPlanned": ["Planned investigation", "Запланированное исследование", "Rejalashtirilgan tadqiqot"],
    "map.legMission": ["Current mission", "Текущая миссия", "Joriy missiya"],
    "map.evTitle": ["Evidence at {o2}% O₂ · {p} kPa", "Данные при {o2}% O₂ · {p} кПа", "{o2}% O₂ · {p} kPa'dagi dalillar"],
    "map.evText": ["flown investigations cover this atmosphere, <strong>{k}</strong> of them with solid materials.", "проведённых исследований охватывают эту атмосферу, из них <strong>{k}</strong> с твёрдыми материалами.", "ta o'tkazilgan tadqiqot bu atmosferani qamrab oladi, ulardan <strong>{k}</strong> tasi qattiq materiallar bilan."],
    "map.evNone": ["None. Every number here is an extrapolation.", "Нет. Все числа здесь — экстраполяция.", "Yo'q. Bu yerdagi har bir raqam ekstrapolyatsiya."],
    "map.howTitle": ["How to read it", "Как читать карту", "Xaritani qanday o'qish kerak"],
    "map.how1": ["Most flight data sits in one cluster at 21% O₂, 101.3 kPa (sea-level air).", "Большинство лётных данных собрано в одной точке: 21% O₂, 101,3 кПа (воздух на уровне моря).", "Parvoz ma'lumotlarining aksariyati bitta nuqtada: 21% O₂, 101,3 kPa (dengiz sathidagi havo)."],
    "map.how2": ["Exploration atmospheres (26.5–34% O₂ at 56–70 kPa) lie above the dashed line: same oxygen partial pressure as sea level, but a higher oxygen <em>concentration</em>, which drives flammability.", "Атмосферы для освоения космоса (26,5–34% O₂ при 56–70 кПа) лежат выше пунктира: парциальное давление кислорода как на уровне моря, но выше его <em>концентрация</em>, а именно она определяет горючесть.", "Kelajak missiyalari atmosferalari (56–70 kPa'da 26,5–34% O₂) punktir chiziqdan yuqorida: kislorod parsial bosimi dengiz sathidagidek, lekin kislorod <em>konsentratsiyasi</em> yuqori va aynan u yonuvchanlikni belgilaydi."],
    "map.how3": ["Only Saffire IV–VI and SoFIE reach that region with solid materials.", "Только Saffire IV–VI и SoFIE исследовали эту область с твёрдыми материалами.", "Bu hududda qattiq materiallar bilan faqat Saffire IV–VI va SoFIE sinov o'tkazgan."],
    "map.how4": ["Apollo 1 sits at the top right: 100% O₂ above sea-level pressure.", "Apollo 1 — справа вверху: 100% O₂ при давлении выше уровня моря.", "Apollo 1 yuqori o'ng burchakda: dengiz sathidan yuqori bosimda 100% O₂."],

    // risk
    "rk.title": ["Fire Risk Explorer", "Оценка пожарного риска", "Yong'in xavfi tahlili"],
    "rk.desc": ["Choose an atmosphere, gravity level, ventilation speed and material. VULKAN estimates whether a flame can spread, shows the evidence behind the estimate, and flags where no flight data exists yet.", "Выберите атмосферу, гравитацию, скорость вентиляции и материал. VULKAN оценит, может ли распространяться пламя, покажет данные, на которых основана оценка, и отметит, где лётных данных ещё нет.", "Atmosfera, gravitatsiya, ventilyatsiya tezligi va materialni tanlang. VULKAN alanga tarqala oladimi yoki yo'qligini baholaydi, bahoning asosidagi dalillarni ko'rsatadi va parvoz ma'lumotlari hali yo'q joylarni belgilaydi."],
    "rk.material": ["Material", "Материал", "Material"],
    "rk.oxygen": ["Oxygen", "Кислород", "Kislorod"],
    "rk.pressure": ["Pressure", "Давление", "Bosim"],
    "rk.gravity": ["Gravity", "Гравитация", "Gravitatsiya"],
    "rk.gHint": ["0 = orbit · 0.166 = Moon · 0.378 = Mars · 1 = Earth", "0 = орбита · 0,166 = Луна · 0,378 = Марс · 1 = Земля", "0 = orbita · 0,166 = Oy · 0,378 = Mars · 1 = Yer"],
    "rk.vent": ["Ventilation flow", "Скорость вентиляции", "Ventilyatsiya oqimi"],
    "rk.vHint": ["ISS cabin air moves at roughly 5–20 cm/s. 0 = ventilation shut off.", "Воздух в модулях МКС движется со скоростью около 5–20 см/с. 0 = вентиляция выключена.", "XKS kabinasida havo taxminan 5–20 sm/s tezlikda harakatlanadi. 0 = ventilyatsiya o'chirilgan."],
    "rk.note": ["Model v2: the normal-gravity limit is NASA's measured upward-burning limit (NASA-STD-6001 Test 1 MOC) where NASA has published one, shifted by NASA's measured pressure effect (0.6 points per psi). In microgravity the limit drops 2.4 points (BASS-II), rises again in very slow flow (quenching) and very fast flow (blow-off), and buoyancy at partial gravity adds part of the 1 g penalty back. Checked against NASA measurements below.", "Модель v2: предел при земной гравитации — измеренный NASA предел горения снизу вверх (MOC по NASA-STD-6001 Test 1), если NASA его опубликовало, с поправкой на измеренное NASA влияние давления (0,6 пункта на psi). В микрогравитации предел ниже на 2,4 пункта (BASS-II), снова растёт при очень слабом потоке (гашение) и очень сильном (срыв), а конвекция при частичной гравитации возвращает часть земной поправки. Проверка по измерениям NASA — ниже.", "Model v2: Yer gravitatsiyasidagi chegara NASA o'lchagan pastdan yuqoriga yonish chegarasi (NASA-STD-6001 Test 1 MOC), agar NASA uni e'lon qilgan bo'lsa, va NASA o'lchagan bosim ta'siri bilan tuzatiladi (har psi uchun 0,6 punkt). Mikrogravitatsiyada chegara 2,4 punkt pasayadi (BASS-II), juda sekin oqimda (so'nish) va juda tez oqimda (uzilish) yana ko'tariladi, qisman gravitatsiyada esa konveksiya Yerdagi tuzatishning bir qismini qaytaradi. NASA o'lchovlari bilan tekshiruv pastda."],
    "rk.range": ["likely {lo}–{hi}%", "вероятно {lo}–{hi}%", "ehtimoliy {lo}–{hi}%"],
    "rk.optMoc": ["NASA MOC {o2}%", "MOC NASA {o2}%", "NASA MOC {o2}%"],
    "rk.optLoi": ["LOI {o2}% (unverified)", "LOI {o2}% (не проверено)", "LOI {o2}% (tekshirilmagan)"],
    "rk.anchorMoc": ["Anchored to NASA's upward-burning test (NASA-STD-6001 Test 1): MOC {o2}% O₂ at {psia} psia. Source: {src}", "Привязано к тесту NASA на горение снизу вверх (NASA-STD-6001 Test 1): MOC {o2}% O₂ при {psia} psia. Источник: {src}", "NASA'ning pastdan yuqoriga yonish sinoviga (NASA-STD-6001 Test 1) bog'langan: {psia} psia'da MOC {o2}% O₂. Manba: {src}"],
    "rk.anchorEst": ["Estimated from NASA data: {o2}% O₂ at {psia} psia, with a wider range. Source: {src}", "Оценка по данным NASA: {o2}% O₂ при {psia} psia, диапазон шире. Источник: {src}", "NASA ma'lumotidan baholangan: {psia} psia'da {o2}% O₂, oraliq kengroq. Manba: {src}"],
    "rk.anchorLoi": ["No NASA upward-burning result was found for this material, so VULKAN uses its Limiting Oxygen Index ({o2}%). Treat it as unverified: for other materials NASA's limit was up to 11 points below the LOI.", "Для этого материала не найден результат NASA по горению снизу вверх, поэтому VULKAN использует кислородный индекс ({o2}%). Считайте оценку непроверенной: у других материалов предел NASA был ниже LOI до 11 пунктов.", "Bu material uchun NASA'ning pastdan yuqoriga yonish natijasi topilmadi, shuning uchun VULKAN kislorod indeksidan ({o2}%) foydalanadi. Buni tekshirilmagan deb qabul qiling: boshqa materiallarda NASA chegarasi LOI'dan 11 punktgacha past chiqqan."],
    "rk.bandTip": ["Shaded band: likely range from NASA test steps and the spread of NASA's pressure effects", "Полоса: вероятный диапазон по шагам тестов NASA и разбросу влияния давления", "Polosa: NASA sinov qadamlari va bosim ta'siri tarqoqligi bo'yicha ehtimoliy oraliq"],
    "va.title": ["How accurate is this model?", "Насколько точна эта модель?", "Bu model qanchalik aniq?"],
    "va.eyebrow": ["Checked against {n} NASA measurements", "Проверено по {n} измерениям NASA", "NASA'ning {n} ta o'lchovi bilan tekshirilgan"],
    "va.lede": ["We compared VULKAN with NASA results from orbit (BASS, BASS-II, SSCE) and from NASA White Sands upward-burning tests. The first version, calibrated to the Limiting Oxygen Index, called a material safe in {u} of {n} cases where NASA saw it burn or measured a lower limit. Version 2 is anchored to NASA's own numbers and errs only on the cautious side.", "Мы сравнили VULKAN с результатами NASA на орбите (BASS, BASS-II, SSCE) и с испытаниями NASA White Sands на горение снизу вверх. Первая версия, откалиброванная по кислородному индексу, в {u} из {n} случаев считала материал безопасным, хотя NASA видело горение или измерило более низкий предел. Версия 2 привязана к числам NASA и ошибается только в осторожную сторону.", "VULKAN'ni NASA'ning orbitadagi (BASS, BASS-II, SSCE) natijalari va NASA White Sands'dagi pastdan yuqoriga yonish sinovlari bilan solishtirdik. Kislorod indeksiga moslangan birinchi versiya {n} holatdan {u} tasida materialni xavfsiz deb hisoblagan, NASA esa uning yonganini ko'rgan yoki pastroq chegara o'lchagan. 2-versiya NASA'ning o'z raqamlariga bog'langan va faqat ehtiyotkor tomonga xato qiladi."],
    "va.before": ["Before: LOI-based (v1)", "До: по LOI (v1)", "Oldin: LOI asosida (v1)"],
    "va.now": ["Now: NASA-anchored (v2)", "Сейчас: по данным NASA (v2)", "Hozir: NASA'ga bog'langan (v2)"],
    "va.ok": ["{n} correct", "{n} верно", "{n} ta to'g'ri"],
    "va.unsafe": ["{n} unsafe misses", "{n} опасных промахов", "{n} ta xavfli xato"],
    "va.cons": ["{n} too cautious", "{n} слишком осторожно", "{n} ta ortiqcha ehtiyotkor"],
    "va.thMat": ["Material", "Материал", "Material"],
    "va.thCond": ["Conditions", "Условия", "Sharoit"],
    "va.thObs": ["NASA result", "Результат NASA", "NASA natijasi"],
    "va.thBefore": ["Before (v1)", "До (v1)", "Oldin (v1)"],
    "va.thNow": ["Now (v2)", "Сейчас (v2)", "Hozir (v2)"],
    "va.thSrc": ["Source", "Источник", "Manba"],
    "va.orbit": ["orbit", "орбита", "orbita"],
    "va.still": ["still air", "неподвижный воздух", "harakatsiz havo"],
    "va.obsMoc": ["upward limit (MOC) {o2}%", "предел снизу вверх (MOC) {o2}%", "yuqoriga yonish chegarasi (MOC) {o2}%"],
    "va.obsUloi": ["upward index {o2}%, so MOC ≈ {lo}–{hi}%", "восходящий индекс {o2}%, значит MOC ≈ {lo}–{hi}%", "yuqoriga yonish indeksi {o2}%, demak MOC ≈ {lo}–{hi}%"],
    "va.obsBurns": ["burned at {o2}% O₂", "горело при {o2}% O₂", "{o2}% O₂'da yongan"],
    "va.obsNoburn": ["no flame at {o2}% O₂", "не горело при {o2}% O₂", "{o2}% O₂'da yonmagan"],
    "va.v.ok": ["correct", "верно", "to'g'ri"],
    "va.v.unsafe": ["unsafe", "опасно", "xavfli"],
    "va.v.cons": ["cautious", "осторожно", "ehtiyotkor"],
    "va.v.na": ["—", "—", "—"],
    "va.tuned": ["† Used to set a model constant; the other {n} rows are independent checks.", "† Использовано для настройки константы модели; остальные {n} строки — независимые проверки.", "† Model konstantasini sozlashda ishlatilgan; qolgan {n} qator mustaqil tekshiruv."],
    "va.limits": ["Limits: BASS samples were narrower than real items, so VULKAN is cautious there; materials without a NASA result keep a ±3-point band; partial gravity stays an extrapolation until FM2 and FLARE report. This is a screening tool, not a certification method (NASA-STD-6001 remains the standard).", "Ограничения: образцы BASS уже реальных изделий, поэтому там VULKAN осторожен; у материалов без результата NASA полоса ±3 пункта; частичная гравитация остаётся экстраполяцией до результатов FM2 и FLARE. Это инструмент скрининга, а не метод сертификации (стандартом остаётся NASA-STD-6001).", "Cheklovlar: BASS namunalari real buyumlardan torroq, shuning uchun u yerda VULKAN ehtiyotkor; NASA natijasi yo'q materiallarda oraliq ±3 punkt; FM2 va FLARE natijalari chiqquncha qisman gravitatsiya ekstrapolyatsiya bo'lib qoladi. Bu dastlabki baholash vositasi, sertifikatlash usuli emas (standart NASA-STD-6001 bo'lib qoladi)."],
    "fm.title": ["Our prediction for the first fire on the Moon", "Наш прогноз для первого огня на Луне", "Oydagi birinchi olov uchun bashoratimiz"],
    "fm.frozen": ["Frozen {d}, before FM2 flies", "Зафиксировано {d}, до полёта FM2", "{d} da muhrlangan, FM2 uchishidan oldin"],
    "fm.lede": ["NASA's FM2 will burn fabric samples upward in lunar gravity at 8.2 psia with 37, 33, 29 and 25% oxygen. VULKAN's calls for three materials are written down now, so FM2 can prove them right or wrong:", "FM2 NASA сожжёт образцы ткани снизу вверх при лунной гравитации и 8,2 psia с 37, 33, 29 и 25% кислорода. Прогнозы VULKAN для трёх материалов записаны сейчас, чтобы FM2 мог их подтвердить или опровергнуть:", "NASA'ning FM2 tajribasi Oy gravitatsiyasida, 8,2 psia'da, 37, 33, 29 va 25% kislorodda mato namunalarini pastdan yuqoriga yoqadi. VULKAN'ning uch material uchun bashorati hozir yozib qo'yildi, FM2 uni tasdiqlashi yoki rad etishi mumkin:"],
    "fm.thLimit": ["Lunar limit (range)", "Лунный предел (диапазон)", "Oydagi chegara (oraliq)"],
    "fm.burn": ["burns", "горит", "yonadi"],
    "fm.edge": ["too close to call", "на грани", "chegarada"],
    "fm.out": ["goes out", "гаснет", "o'chadi"],
    "fm.nasa": ["NASA expects its FM2 fabric to have a lunar limit of 24–26% O₂ and the 25% test not to ignite. VULKAN's Nomex limit ({x}%) falls inside that window. Source: {src}", "NASA ожидает, что у ткани FM2 лунный предел 24–26% O₂ и тест при 25% не воспламенится. Предел Nomex по VULKAN ({x}%) попадает в это окно. Источник: {src}", "NASA FM2 matosining Oydagi chegarasi 24–26% O₂ bo'lishini va 25% sinovda yonmasligini kutmoqda. VULKAN bo'yicha Nomex chegarasi ({x}%) shu oraliqqa tushadi. Manba: {src}"],
    "rk.chart": ["Limiting oxygen vs flow at the flame", "Предельный кислород в зависимости от потока у пламени", "Alanga yonidagi oqimga qarab chegaraviy kislorod"],
    "rk.shaded": ["Shaded = flame can spread", "Закрашено = пламя может распространяться", "Bo'yalgan = alanga tarqala oladi"],
    "rk.worlds": ["Same atmosphere, different worlds", "Одна атмосфера, разные миры", "Bir xil atmosfera, turli olamlar"],
    "rk.evidence": ["Evidence behind this estimate", "На чём основана оценка", "Baho asosidagi dalillar"],
    "rk.orbit": ["µg (orbit)", "µg (орбита)", "µg (orbita)"],
    "rk.evLevel": ["Evidence: {l}", "Данные: {l}", "Dalillar: {l}"],
    "rk.loc": ["Estimated limiting O₂", "Оценка предельного O₂", "Taxminiy chegaraviy O₂"],
    "rk.margin": ["Margin (O₂ − limit)", "Запас (O₂ − предел)", "Zaxira (O₂ − chegara)"],
    "rk.pts": ["pts", "п.", "ball"],
    "rk.pp": ["O₂ partial pressure", "Парциальное давление O₂", "O₂ parsial bosimi"],
    "rk.ueff": ["Flow at flame (vent + buoyant)", "Поток у пламени (вент. + конвекция)", "Alanga yonidagi oqim (vent. + konveksiya)"],
    "rk.thG": ["Gravity", "Гравитация", "Gravitatsiya"],
    "rk.thLimit": ["Limit", "Предел", "Chegara"],
    "rk.thState": ["State", "Состояние", "Holat"],
    "w.orbit": ["Orbit (µg)", "Орбита (µg)", "Orbita (µg)"],
    "w.moon": ["Moon", "Луна", "Oy"],
    "w.mars": ["Mars", "Марс", "Mars"],
    "w.earth": ["Earth", "Земля", "Yer"],
    "rk.testedHere": ["tested this atmosphere", "испытывали в этой атмосфере", "bu atmosferada sinalgan"],
    "rk.nearest": ["nearest tested range", "ближайший испытанный диапазон", "eng yaqin sinalgan oraliq"],
    "rk.physics": ["Supporting physics: BASS (flammability at lower O₂ in low-speed flow), SSCE (quiescent extinction), Saffire (large-scale growth).", "Физическая основа: BASS (горение при меньшем O₂ в слабом потоке), SSCE (затухание в неподвижном воздухе), Saffire (развитие крупного пожара).", "Fizik asos: BASS (kuchsiz oqimda pastroq O₂'da yonish), SSCE (harakatsiz havoda so'nish), Saffire (katta yong'in rivojlanishi)."],
    "rk.xAxis": ["Effective flow at the flame, cm/s (log scale)", "Эффективный поток у пламени, см/с (лог. шкала)", "Alanga yonidagi samarali oqim, sm/s (log shkala)"],
    "rk.canSpread": ["flame can spread", "пламя распространяется", "alanga tarqaladi"],
    "rk.selfExt": ["self-extinguishes", "самозатухание", "o'z-o'zidan o'chadi"],
    "rk.cabinO2": ["cabin O₂ {o2}%", "O₂ в кабине {o2}%", "kabinada O₂ {o2}%"],

    // model states and notes
    "st.0": ["Self-extinguishing", "Самозатухание", "O'z-o'zidan o'chadi"],
    "st.1": ["Near the limit", "Близко к пределу", "Chegaraga yaqin"],
    "st.2": ["Flammable", "Горючий", "Yonuvchan"],
    "st.3": ["Highly flammable", "Легковоспламеняемый", "O'ta yonuvchan"],
    "stx.0": ["Oxygen is well below the estimated limit for this flow. A flame is not expected to spread.", "Кислород значительно ниже расчётного предела для этого потока. Пламя не должно распространяться.", "Kislorod bu oqim uchun taxminiy chegaradan ancha past. Alanga tarqalishi kutilmaydi."],
    "stx.1": ["Within 3 points of the estimated limit. Small changes in flow or oxygen can make it burn.", "В пределах 3 пунктов от расчётного предела. Небольшое изменение потока или кислорода может вызвать горение.", "Taxminiy chegaradan 3 ball ichida. Oqim yoki kisloroddagi kichik o'zgarish yonishga olib kelishi mumkin."],
    "stx.2": ["Oxygen is above the estimated limit. A flame can spread over this material.", "Кислород выше расчётного предела. Пламя может распространяться по этому материалу.", "Kislorod taxminiy chegaradan yuqori. Alanga bu material bo'ylab tarqala oladi."],
    "stx.3": ["Oxygen is far above the estimated limit. Expect fast flame spread.", "Кислород намного выше расчётного предела. Ожидается быстрое распространение пламени.", "Kislorod taxminiy chegaradan ancha yuqori. Alanga tez tarqalishi kutiladi."],
    "lv.High": ["High", "Высокая", "Yuqori"],
    "lv.Medium": ["Medium", "Средняя", "O'rtacha"],
    "lv.Low": ["Low", "Низкая", "Past"],
    "lv.Very low": ["Very low", "Очень низкая", "Juda past"],
    "lv.Low (extrapolated)": ["Low (extrapolated)", "Низкая (экстраполяция)", "Past (ekstrapolyatsiya)"],
    "cov.many": ["{n} solid-fuel investigations tested this O₂ / pressure.", "{n} исследования с твёрдым топливом проводились при этих O₂ / давлении.", "{n} ta qattiq yoqilg'i tadqiqoti shu O₂ / bosimda o'tkazilgan."],
    "cov.one": ["Only {name} tested this O₂ / pressure.", "При этих O₂ / давлении испытывал только {name}.", "Shu O₂ / bosimda faqat {name} sinov o'tkazgan."],
    "cov.near": ["Closest data: {name}. This point is an extrapolation.", "Ближайшие данные: {name}. Эта точка — экстраполяция.", "Eng yaqin ma'lumot: {name}. Bu nuqta ekstrapolyatsiya."],
    "cov.none": ["No solid-fuel flight data near this atmosphere.", "Рядом с этой атмосферой нет лётных данных по твёрдому топливу.", "Bu atmosfera yaqinida qattiq yoqilg'i bo'yicha parvoz ma'lumotlari yo'q."],
    "cov.gravity": ["Gravity differs from the flight data, so confidence is reduced one level.", "Гравитация отличается от условий полёта, поэтому достоверность снижена на один уровень.", "Gravitatsiya parvoz sharoitidan farq qiladi, shuning uchun ishonchlilik bir darajaga pasaytirildi."],
    "flag.g": ["No partial-gravity flight data exists in PSI. Lunar and Mars values are model extrapolations (FM2, FLARE planned).", "В PSI нет данных при частичной гравитации. Значения для Луны и Марса — экстраполяция модели (запланированы FM2, FLARE).", "PSI'da qisman gravitatsiya bo'yicha parvoz ma'lumotlari yo'q. Oy va Mars qiymatlari model ekstrapolyatsiyasi (FM2, FLARE rejalashtirilgan)."],
    "flag.o2": ["Above 40% O₂, only gas-flame data (CFI-G, up to 85%) exists; no solid-material flight data.", "Выше 40% O₂ есть только данные по газовым пламенам (CFI-G, до 85%); лётных данных по твёрдым материалам нет.", "40% O₂ dan yuqorida faqat gaz alangasi ma'lumotlari bor (CFI-G, 85% gacha); qattiq materiallar bo'yicha parvoz ma'lumotlari yo'q."],
    "flag.p": ["Below 50 kPa only SoFIE's chamber reaches this range.", "Ниже 50 кПа этот диапазон охватывает только камера SoFIE.", "50 kPa dan past oraliqni faqat SoFIE kamerasi qamrab oladi."],
    "why.tested": ["tested at {s} O₂ / pressure", "испытано при O₂ / давлении: {s}", "{s} O₂ / bosimida sinalgan"],
    "why.plannedCover": ["planned to cover {s} conditions", "запланировано для условий: {s}", "{s} sharoitlari uchun rejalashtirilgan"],
    "why.far": ["tested far from {o2}% O₂ / {p} kPa", "испытано далеко от {o2}% O₂ / {p} кПа", "{o2}% O₂ / {p} kPa'dan uzoqda sinalgan"],
    "why.scale": ["spacecraft-scale fire", "пожар масштаба корабля", "kema miqyosidagi yong'in"],
    "why.data": ["large public dataset", "большой открытый набор данных", "katta ochiq ma'lumotlar to'plami"],
    "why.gap": ["fills the partial-gravity gap", "закрывает пробел по частичной гравитации", "qisman gravitatsiya bo'shlig'ini to'ldiradi"],
    "why.detector": ["drives detector design", "определяет конструкцию датчиков", "datchiklar dizaynini belgilaydi"],
    "why.suppressant": ["sets suppressant margins", "задаёт запас для огнетушащих веществ", "o'chiruvchi moddalar zaxirasini belgilaydi"],

    // ranker
    "rn.title": ["Mission Ranker", "Рейтинг для миссии", "Missiya reytingi"],
    "rn.desc": ["Ranks every investigation for <strong>{s}</strong> ({o2}% O₂, {p} kPa, {g} g). Move the weights to reflect what your team values; the score and the reason for it update live.", "Ранжирует все исследования для миссии <strong>{s}</strong> ({o2}% O₂, {p} кПа, {g} g). Меняйте веса под приоритеты команды — оценка и её объяснение обновляются сразу.", "Barcha tadqiqotlarni <strong>{s}</strong> uchun tartiblaydi ({o2}% O₂, {p} kPa, {g} g). Jamoangiz ustuvorliklariga qarab vaznlarni o'zgartiring; ball va uning izohi darhol yangilanadi."],
    "rn.atmosphere": ["Atmosphere match", "Совпадение атмосферы", "Atmosfera mosligi"],
    "rn.hazard": ["Hazard relevance", "Значимость опасности", "Xavf ahamiyati"],
    "rn.scale": ["Fire scale realism", "Реалистичность масштаба", "Yong'in miqyosi realligi"],
    "rn.data": ["Data richness", "Объём данных", "Ma'lumotlar boyligi"],
    "rn.recency": ["Recency", "Новизна", "Yangilik"],
    "rn.reset": ["Reset weights", "Сбросить веса", "Vaznlarni tiklash"],
    "rn.note": ["<strong>Atmosphere match</strong>: distance between the mission atmosphere and the O₂ / pressure range tested. <strong>Hazard relevance</strong>: how much this fire type matters for the mission (e.g. solids for habitats). <strong>Scale</strong>: sample size up to spacecraft scale. <strong>Data richness</strong>: test count and public PSI data. <strong>Recency</strong>: newer hardware and diagnostics.", "<strong>Совпадение атмосферы</strong>: насколько атмосфера миссии близка к испытанному диапазону O₂ / давления. <strong>Значимость опасности</strong>: насколько этот тип горения важен для миссии (например, твёрдые материалы для жилых модулей). <strong>Масштаб</strong>: размер образца вплоть до масштаба корабля. <strong>Объём данных</strong>: число тестов и открытые данные PSI. <strong>Новизна</strong>: более новое оборудование и диагностика.", "<strong>Atmosfera mosligi</strong>: missiya atmosferasi sinalgan O₂ / bosim oralig'iga qanchalik yaqinligi. <strong>Xavf ahamiyati</strong>: bu yonish turi missiya uchun qanchalik muhim (masalan, yashash modullari uchun qattiq materiallar). <strong>Miqyos</strong>: namuna o'lchami, kema miqyosigacha. <strong>Ma'lumotlar boyligi</strong>: sinovlar soni va PSI'dagi ochiq ma'lumotlar. <strong>Yangilik</strong>: yangiroq uskuna va o'lchov asboblari."],
    "rn.contrib": ["Score contributions", "Вклад в оценку", "Ballga hissa"],

    // ask
    "ask.title": ["Ask VULKAN", "Спросить VULKAN", "VULKAN'dan so'rash"],
    "ask.desc": ["Ask in plain language. VULKAN retrieves evidence from the curated NASA record, runs the flammability model when you mention a material or atmosphere, and answers with citations, a confidence level and research-gap warnings.", "Спрашивайте простым языком. VULKAN находит данные в отобранных материалах NASA, запускает модель горючести, если вы упоминаете материал или атмосферу, и отвечает со ссылками, оценкой достоверности и предупреждениями о пробелах в исследованиях.", "Oddiy tilda so'rang. VULKAN NASA ma'lumotlaridan dalil topadi, material yoki atmosferani tilga olsangiz yonuvchanlik modelini ishga tushiradi va manbalar, ishonchlilik darajasi hamda tadqiqot bo'shliqlari haqida ogohlantirish bilan javob beradi."],
    "ask.checking": ["Checking AI engine…", "Проверяем AI-движок…", "AI tizimi tekshirilmoqda…"],
    "ask.placeholder": ["e.g. How should we suppress a fabric fire in a lunar habitat?", "напр. Как тушить возгорание ткани в лунном модуле?", "masalan: Oy modulida mato yong'inini qanday o'chirish kerak?"],
    "ask.aria": ["Your question", "Ваш вопрос", "Savolingiz"],
    "ask.send": ["Ask", "Спросить", "So'rash"],
    "ask.try": ["Try asking", "Попробуйте спросить", "So'rab ko'ring"],
    "ask.how": ["How answers are built", "Как строятся ответы", "Javoblar qanday tuziladi"],
    "ask.how1": ["BM25 retrieval over {n} evidence passages: investigations, insights, history, physics notes, NASA material tests and VULKAN's model check.", "Поиск BM25 по {n} фрагментам данных: исследования, выводы, история, физика, испытания материалов NASA и проверка модели VULKAN.", "{n} ta dalil parchasidan BM25 qidiruvi: tadqiqotlar, xulosalar, tarix, fizika, NASA material sinovlari va VULKAN modeli tekshiruvi."],
    "ask.how2": ["With an AI model online (Claude, or OpenAI as a low-cost option), the server also searches the NASA Technical Reports Server for the question and adds the matching report abstracts. The model must cite every claim; anything not in the NASA sources is marked “general knowledge, not NASA data”.", "Когда AI-модель подключена (Claude или недорогой OpenAI), сервер также ищет вопрос в NASA Technical Reports Server и добавляет аннотации найденных отчётов. Модель обязана ссылаться на источник каждого утверждения; всё, чего нет в источниках NASA, помечается «общие знания, не данные NASA».", "AI modeli ulanganda (Claude yoki arzon OpenAI), server savolni NASA Technical Reports Server'dan ham qidiradi va topilgan hisobotlar annotatsiyalarini qo'shadi. Model har bir da'vo uchun manba ko'rsatishi shart; NASA manbalarida yo'q narsa “umumiy bilim, NASA ma'lumoti emas” deb belgilanadi."],
    "ask.how3": ["Offline, a local reasoner builds the answer from the same evidence, the flammability model and the mission ranker.", "Без сети локальный модуль строит ответ по тем же данным, модели горючести и рейтингу миссии.", "Oflayn rejimda mahalliy tahlilchi javobni xuddi shu dalillar, yonuvchanlik modeli va missiya reytingi asosida tuzadi."],
    "ask.how4": ["Every answer shows the evidence confidence and the data gaps it touches.", "Каждый ответ показывает достоверность данных и затронутые пробелы.", "Har bir javob dalillar ishonchliligini va tegishli bo'shliqlarni ko'rsatadi."],
    "ask.hello": ["Hello. I'm VULKAN. I know {n} NASA combustion investigations and the current mission context: **{s}**. Ask about materials, oxygen levels, detection, suppression or any investigation.", "Здравствуйте, я VULKAN. Я знаю {n} исследований горения NASA и текущую миссию: **{s}**. Спрашивайте о материалах, уровне кислорода, обнаружении, тушении или любом исследовании.", "Salom, men VULKAN. Men NASA'ning {n} ta yonish tadqiqotini va joriy missiyani bilaman: **{s}**. Materiallar, kislorod darajasi, aniqlash, o'chirish yoki istalgan tadqiqot haqida so'rang."],
    "ask.conf": ["confidence: {c}", "достоверность: {c}", "ishonchlilik: {c}"],
    "ask.gap": ["gap", "пробел", "bo'shliq"],
    "ask.error": ["Something went wrong: {e}. Please try again.", "Что-то пошло не так: {e}. Попробуйте ещё раз.", "Xatolik yuz berdi: {e}. Qaytadan urinib ko'ring."],
    "ask.online": ["AI online · {p} <span class=\"muted\">({m})</span>", "AI подключён · {p} <span class=\"muted\">({m})</span>", "AI ulangan · {p} <span class=\"muted\">({m})</span>"],
    "ask.offline": ["Offline mode · built-in reasoner", "Офлайн-режим · встроенный модуль", "Oflayn rejim · ichki tahlilchi"],
    "ask.unreachable": ["The AI model was unreachable ({e}); answered with the offline reasoner.", "AI-модель недоступна ({e}); ответил офлайн-модуль.", "AI modeliga ulanib bo'lmadi ({e}); oflayn tahlilchi javob berdi."],

    // voice assistant
    "v.aiVoice": ["Spoken answers are AI-generated speech (OpenAI text-to-speech) when the server voice is on, otherwise your browser's voice.", "Ответы вслух — синтетическая речь ИИ (OpenAI text-to-speech), если включён серверный голос, иначе голос браузера.", "Ovozli javoblar server ovozi yoqilganda sun'iy intellekt yaratgan nutq (OpenAI text-to-speech), aks holda brauzeringiz ovozi."],
    "v.title": ["Voice assistant", "Голосовой помощник", "Ovozli yordamchi"],
    "v.mic": ["Speak your question", "Задать вопрос голосом", "Savolni ovoz bilan berish"],
    "v.listening": ["Listening… tap the microphone to stop", "Слушаю… нажмите на микрофон, чтобы остановить", "Tinglayapman… to'xtatish uchun mikrofonni bosing"],
    "v.transcribing": ["Recognising speech…", "Распознаю речь…", "Nutq aniqlanmoqda…"],
    "v.readAloud": ["Read answers aloud (short answer, key action first)", "Читать ответы вслух (кратко, сначала главное действие)", "Javoblarni ovoz chiqarib o'qish (qisqa, avval asosiy chora)"],
    "v.wake": ["Hands-free: say “Hey VULKAN”, then your question", "Без рук: скажите «Эй, Вулкан» и задайте вопрос", "Qo'lsiz: “Hey VULKAN” deng, keyin savolingizni ayting"],
    "v.wakeOn": ["Listening for “Hey VULKAN”…", "Жду фразу «Эй, Вулкан»…", "“Hey VULKAN” so'zini kutyapman…"],
    "v.wakeHeard": ["Yes? Ask your question.", "Да? Задайте вопрос.", "Ha? Savolingizni bering."],
    "v.wakeUnsupported": ["Hands-free mode needs Chrome or Edge.", "Режим «без рук» работает в Chrome или Edge.", "Qo'lsiz rejim Chrome yoki Edge'da ishlaydi."],
    "v.wakeMiss": ["Heard “{s}”. Start with “Hey VULKAN” to ask.", "Услышано: «{s}». Чтобы спросить, начните с «Эй, Вулкан».", "Eshitildi: “{s}”. Savol berish uchun “Hey VULKAN” deb boshlang."],
    "v.diagLive": ["mic on, listening", "микрофон включён, слушаю", "mikrofon yoniq, tinglayapman"],
    "v.diagOff": ["mic restarting", "микрофон перезапускается", "mikrofon qayta yoqilmoqda"],
    "v.diagHeard": ["hearing: “{s}”", "слышу: «{s}»", "eshityapman: “{s}”"],
    "v.err.network": ["the browser's speech service is unreachable (network); check the internet connection", "сервис распознавания речи браузера недоступен (сеть); проверьте интернет", "brauzerning nutqni tanish xizmatiga ulanib bo'lmadi (tarmoq); internetni tekshiring"],
    "v.err.audio-capture": ["no microphone found, or another app is using it", "микрофон не найден или занят другой программой", "mikrofon topilmadi yoki uni boshqa dastur ishlatyapti"],
    "v.err.not-allowed": ["microphone permission denied; allow it in the address bar", "доступ к микрофону запрещён; разрешите его в адресной строке", "mikrofonga ruxsat berilmagan; manzil satridan ruxsat bering"],
    "v.err.service-not-allowed": ["this browser blocks speech recognition; use Chrome", "этот браузер блокирует распознавание речи; используйте Chrome", "bu brauzer nutqni tanishni bloklaydi; Chrome'dan foydalaning"],
    "v.err.language-not-supported": ["this language is not supported here; switching language for the wake word", "этот язык здесь не поддерживается; меняю язык для слова-пробуждения", "bu til bu yerda qo'llab-quvvatlanmaydi; chaqiruv so'zi uchun tilni almashtiryapman"],
    "v.err.start-failed": ["could not start listening; retrying", "не удалось начать прослушивание; повторяю", "tinglashni boshlab bo'lmadi; qayta urinyapman"],
    "v.errOther": ["speech error: {e}", "ошибка речи: {e}", "nutq xatosi: {e}"],
    "v.engOpenAI": ["Voice: OpenAI speech recognition and natural voice", "Голос: распознавание речи и естественный голос OpenAI", "Ovoz: OpenAI nutqni aniqlash va tabiiy ovoz"],
    "v.engBrowser": ["Voice: built-in browser speech (best in Chrome or Edge)", "Голос: встроенная речь браузера (лучше всего в Chrome или Edge)", "Ovoz: brauzerning o'z nutq tizimi (Chrome yoki Edge'da yaxshi ishlaydi)"],
    "v.engNone": ["This browser has no speech recognition. Typing still works; use Chrome or Edge for voice.", "В этом браузере нет распознавания речи. Ввод текстом работает; для голоса используйте Chrome или Edge.", "Bu brauzerda nutqni aniqlash yo'q. Yozib so'rash ishlaydi; ovoz uchun Chrome yoki Edge'dan foydalaning."],
    "v.noVoice": ["This browser has no {lang} voice, so the answer is shown but not read aloud.", "В этом браузере нет голоса для языка «{lang}», поэтому ответ показан, но не озвучен.", "Bu brauzerda {lang} tilidagi ovoz yo'q, shuning uchun javob ko'rsatildi, lekin o'qilmadi."],
    "v.denied": ["Microphone access is blocked. Allow it in the browser to use voice.", "Доступ к микрофону заблокирован. Разрешите его в браузере, чтобы пользоваться голосом.", "Mikrofonga ruxsat berilmagan. Ovozdan foydalanish uchun brauzerda ruxsat bering."],
    "v.notHeard": ["I didn't catch that. Please try again.", "Не расслышал. Попробуйте ещё раз.", "Eshitmadim. Qaytadan urinib ko'ring."],
    "v.stop": ["Stop speaking", "Остановить речь", "Ovozni to'xtatish"],
    "v.quick": ["Emergency commands", "Экстренные команды", "Favqulodda buyruqlar"],
    "v.fire": ["Fire", "Пожар", "Yong'in"],
    "v.smoke": ["Smoke", "Дым", "Tutun"],
    "v.cmdHint": ["Say or type “fire” or “smoke” for immediate actions, or “stop” to silence the voice.", "Скажите или напишите «пожар» или «дым», чтобы получить срочные действия, или «стоп», чтобы выключить голос.", "Zudlik bilan bajariladigan choralar uchun “yong'in” yoki “tutun” deng yoki yozing, ovozni o'chirish uchun “to'xta” deng."],
    "v.langName": ["English", "русский", "o'zbek"],

    // emergency quick commands (training guidance, cited to the curated evidence)
    "em.note": ["Training guidance built from the NASA evidence in VULKAN, not an official NASA procedure.", "Учебная памятка на основе данных NASA в VULKAN, а не официальная процедура NASA.", "VULKAN'dagi NASA dalillari asosida tuzilgan o'quv yo'riqnomasi, NASA'ning rasmiy tartibi emas."],
    "em.fireTitle": ["**Fire: immediate actions**", "**Пожар: срочные действия**", "**Yong'in: zudlik bilan bajariladigan choralar**"],
    "em.fire1": ["Sound the alarm and alert the crew.", "Подайте сигнал тревоги и предупредите экипаж.", "Signal bering va ekipajni ogohlantiring."],
    "em.fire2": ["Turn the ventilation off: without airflow a microgravity flame is starved of oxygen [SSCE] [INSIGHT-7].", "Отключите вентиляцию: без потока воздуха пламени в микрогравитации не хватает кислорода [SSCE] [INSIGHT-7].", "Ventilyatsiyani o'chiring: havo oqimisiz mikrogravitatsiyada alangaga kislorod yetmaydi [SSCE] [INSIGHT-7]."],
    "em.fire3": ["Cut power to the burning equipment.", "Обесточьте горящее оборудование.", "Yonayotgan uskunaning tokini uzing."],
    "em.fire4": ["Put on breathing masks: microgravity fires make far more soot and smoke [ACME].", "Наденьте дыхательные маски: пожары в микрогравитации дают гораздо больше сажи и дыма [ACME].", "Nafas olish niqoblarini taqing: mikrogravitatsiyadagi yong'inlar ancha ko'p qurum va tutun chiqaradi [ACME]."],
    "em.fire5": ["Use the CO₂ or water-mist extinguisher and flood the fire zone; a weak gas jet can feed the flame [BASS] [FLEX].", "Используйте огнетушитель CO₂ или водяного тумана и заполните зону пожара; слабая струя газа может раздуть пламя [BASS] [FLEX].", "CO₂ yoki suv tumanli o't o'chirgichdan foydalaning va yong'in zonasini to'ldiring; kuchsiz gaz oqimi alangani kuchaytirishi mumkin [BASS] [FLEX]."],
    "em.fire6": ["Confirm the fire is out with gas sensors (CO): cool flames can keep burning invisibly [FLEX] [CFI].", "Подтвердите тушение газовыми датчиками (CO): холодное пламя может гореть невидимо [FLEX] [CFI].", "Yong'in o'chganini gaz datchiklari (CO) bilan tasdiqlang: sovuq alanga ko'rinmasdan yonishda davom etishi mumkin [FLEX] [CFI]."],
    "em.fireSay": ["Fire. Turn the ventilation off, cut power and put on masks. Then flood the fire with the extinguisher, and confirm it is out with gas sensors.", "Пожар. Отключите вентиляцию, обесточьте оборудование и наденьте маски. Затем заполните зону огнетушителем и проверьте тушение газовыми датчиками.", "Yong'in. Ventilyatsiyani o'chiring, tokni uzing va niqob taqing. Keyin yong'inni o't o'chirgich bilan to'ldiring va o'chganini gaz datchiklari bilan tekshiring."],
    "em.smokeTitle": ["**Smoke: immediate actions**", "**Дым: срочные действия**", "**Tutun: zudlik bilan bajariladigan choralar**"],
    "em.smoke1": ["Alert the crew and turn the ventilation off so smoke and oxygen stop moving [SSCE].", "Предупредите экипаж и отключите вентиляцию, чтобы дым и кислород перестали перемещаться [SSCE].", "Ekipajni ogohlantiring va tutun hamda kislorod harakatlanmasligi uchun ventilyatsiyani o'chiring [SSCE]."],
    "em.smoke2": ["Put on breathing masks.", "Наденьте дыхательные маски.", "Nafas olish niqoblarini taqing."],
    "em.smoke3": ["Cut power to suspected equipment: overheating comes before flames [SAME].", "Обесточьте подозрительное оборудование: перегрев предшествует пламени [SAME].", "Shubhali uskunaning tokini uzing: alangadan oldin qizib ketish bo'ladi [SAME]."],
    "em.smoke4": ["Find the source with handheld sensors; spacecraft smoke is sub-micron, so detectors may see it late [SAME] [INSIGHT-5].", "Найдите источник ручными датчиками; дым на корабле субмикронный, и датчики могут заметить его поздно [SAME] [INSIGHT-5].", "Manbani qo'l datchiklari bilan toping; kemadagi tutun submikron, shuning uchun datchiklar uni kech sezishi mumkin [SAME] [INSIGHT-5]."],
    "em.smoke5": ["Keep an extinguisher ready and watch CO and particle readings [SAFFIRE-IV-VI].", "Держите огнетушитель наготове и следите за показаниями CO и частиц [SAFFIRE-IV-VI].", "O't o'chirgichni tayyor tuting va CO hamda zarrachalar ko'rsatkichlarini kuzating [SAFFIRE-IV-VI]."],
    "em.smokeSay": ["Smoke. Alert the crew, turn the ventilation off, put on masks and cut power to the suspected equipment. Then find the source with sensors and keep an extinguisher ready.", "Дым. Предупредите экипаж, отключите вентиляцию, наденьте маски и обесточьте подозрительное оборудование. Затем найдите источник датчиками и держите огнетушитель наготове.", "Tutun. Ekipajni ogohlantiring, ventilyatsiyani o'chiring, niqob taqing va shubhali uskunaning tokini uzing. Keyin manbani datchiklar bilan toping va o't o'chirgichni tayyor tuting."],

    // short spoken summaries of offline answers
    "sp.top": ["Most relevant for {s}: {list}.", "Самое важное для миссии «{s}»: {list}.", "{s} uchun eng muhimlari: {list}."],
    "sp.model": ["{m}: {st}. Estimated limit {loc} percent oxygen, against {o2} percent in the cabin.", "{m}: {st}. Расчётный предел {loc} процента кислорода при {o2} процентах в кабине.", "{m}: {st}. Taxminiy chegara {loc} foiz kislorod, kabinada esa {o2} foiz."],
    "sp.action": ["Key action: {a}", "Главное действие: {a}", "Asosiy chora: {a}"],

    // gaps
    "gp.title": ["Research gaps and Earth benefits", "Пробелы в исследованиях и польза для Земли", "Tadqiqot bo'shliqlari va Yer uchun foyda"],
    "gp.desc": ["Where the NASA record runs out, which planned investigations will fill it, and how spacecraft fire research already protects people on Earth.", "Где заканчиваются данные NASA, какие запланированные исследования их дополнят и как исследования пожаров в космосе уже защищают людей на Земле.", "NASA ma'lumotlari qayerda tugaydi, qaysi rejalashtirilgan tadqiqotlar bu bo'shliqni to'ldiradi va kosmik yong'in tadqiqotlari Yerdagi odamlarni allaqachon qanday himoya qilmoqda."],
    "gp.crit": ["critical", "критично", "jiddiy"],
    "gp.warn": ["important", "важно", "muhim"],
    "gp.info": ["watch", "наблюдать", "kuzatish"],
    "gp.earth": ["Earth benefits", "Польза для Земли", "Yer uchun foyda"],
    "gp.refs": ["References", "Источники", "Manbalar"],
    "gp.loi": ["Material limits: NASA-STD-6001 Test 1 values from the NASA White Sands reports listed above where NASA published one; otherwise typical ASTM D2863 Limiting Oxygen Index values, flagged as unverified in the app.", "Пределы материалов: значения NASA-STD-6001 Test 1 из перечисленных выше отчётов NASA White Sands, где NASA их опубликовало; иначе типичные кислородные индексы по ASTM D2863, помеченные в приложении как непроверенные.", "Material chegaralari: NASA e'lon qilgan joyda yuqoridagi NASA White Sands hisobotlaridagi NASA-STD-6001 Test 1 qiymatlari; boshqa hollarda ASTM D2863 bo'yicha odatiy kislorod indeksi qiymatlari, ilovada tekshirilmagan deb belgilangan."],

    // AI offline templates
    "ai.compare": ["Comparison of {list}", "Сравнение: {list}", "Taqqoslash: {list}"],
    "ai.cmpLine": ["**{name}** ({years}, {cat}): {fuels}. O₂ {o2}, {p}, flow {flow}. Key result: {f}", "**{name}** ({years}, {cat}): {fuels}. O₂ {o2}, {p}, поток {flow}. Главный результат: {f}", "**{name}** ({years}, {cat}): {fuels}. O₂ {o2}, {p}, oqim {flow}. Asosiy natija: {f}"],
    "ai.shareCIR": ["They share the Combustion Integrated Rack.", "Они использовали общую стойку CIR (Combustion Integrated Rack).", "Ular umumiy CIR (Combustion Integrated Rack) uskunasidan foydalangan."],
    "ai.shareMSG": ["They share the Microgravity Science Glovebox.", "Они использовали общий перчаточный бокс MSG.", "Ular umumiy MSG qo'lqopli boksidan foydalangan."],
    "ai.shareNone": ["They used different flight hardware.", "Они использовали разное лётное оборудование.", "Ular turli parvoz uskunalaridan foydalangan."],
    "ai.rankHead": ["**Most relevant investigations for {s}** ({o2}% O₂, {p} kPa, {g} g):", "**Наиболее важные исследования для: {s}** ({o2}% O₂, {p} кПа, {g} g):", "**{s} uchun eng muhim tadqiqotlar** ({o2}% O₂, {p} kPa, {g} g):"],
    "ai.rankLine": ["{n}. **{name}**, score {sc}/100: {why}.", "{n}. **{name}**, оценка {sc}/100: {why}.", "{n}. **{name}**, ball {sc}/100: {why}."],
    "ai.rankFoot": ["Scores combine atmosphere match, hazard relevance, fire scale, data richness and recency. Adjust the weights in the Mission Ranker.", "Оценка учитывает совпадение атмосферы, значимость опасности, масштаб пожара, объём данных и новизну. Веса можно изменить в разделе «Рейтинг для миссии».", "Ball atmosfera mosligi, xavf ahamiyati, yong'in miqyosi, ma'lumotlar boyligi va yangilikni birlashtiradi. Vaznlarni “Missiya reytingi” bo'limida o'zgartirish mumkin."],
    "ai.modelHead": ["**Model estimate for {m}** at {o2}% O₂, {p} kPa ({psia} psia), {g} g:", "**Оценка модели для: {m}** при {o2}% O₂, {p} кПа ({psia} psia), {g} g:", "**Model bahosi: {m}**, {o2}% O₂, {p} kPa ({psia} psia), {g} g:"],
    "ai.model1": ["Estimated limiting O₂: **{loc}%** (at 1 g sea level: {loc1}%). Margin: {m} points → **{st}**.", "Расчётный предел O₂: **{loc}%** (при 1 g на уровне моря: {loc1}%). Запас: {m} п. → **{st}**.", "Taxminiy chegaraviy O₂: **{loc}%** (1 g va dengiz sathida: {loc1}%). Zaxira: {m} ball → **{st}**."],
    "ai.model2": ["Effective flow at the flame ≈ {u} cm/s (ventilation {v} cm/s, buoyant {b} cm/s). Evidence coverage: {lv}. {note}", "Эффективный поток у пламени ≈ {u} см/с (вентиляция {v} см/с, конвекция {b} см/с). Покрытие данными: {lv}. {note}", "Alanga yonidagi samarali oqim ≈ {u} sm/s (ventilyatsiya {v} sm/s, konveksiya {b} sm/s). Dalillar bilan qamrov: {lv}. {note}"],
    "ai.record": ["**What the NASA record shows:**", "**Что показывают данные NASA:**", "**NASA ma'lumotlari nimani ko'rsatadi:**"],
    "ai.setOut": ["{name} set out to {obj}", "{name}, цель: {obj}", "{name}, maqsad: {obj}"],
    "ai.notFound": ["I could not find this topic in the curated NASA combustion record. Try naming an investigation (BASS, FLEX, Saffire, SAME, ACME), a material, or a hazard such as smoke, suppression or oxygen.", "Я не нашёл эту тему в отобранных данных NASA о горении. Назовите исследование (BASS, FLEX, Saffire, SAME, ACME), материал или опасность: дым, тушение, кислород.", "Bu mavzuni NASA yonish ma'lumotlarida topa olmadim. Tadqiqot (BASS, FLEX, Saffire, SAME, ACME), material yoki xavf nomini yozing: tutun, o'chirish, kislorod."],
    "ai.action": ["**Recommended action:** {a}", "**Рекомендуемое действие:** {a}", "**Tavsiya etilgan chora:** {a}"],
    "gapf.g": ["No partial-gravity combustion data in PSI yet (FM2, FLARE planned).", "В PSI пока нет данных о горении при частичной гравитации (запланированы FM2, FLARE).", "PSI'da hali qisman gravitatsiyada yonish ma'lumotlari yo'q (FM2, FLARE rejalashtirilgan)."],
    "gapf.o2": ["Solid-material flight data above 27% O₂ is limited to Saffire IV–VI and SoFIE.", "Лётные данные по твёрдым материалам выше 27% O₂ есть только у Saffire IV–VI и SoFIE.", "27% O₂ dan yuqori qattiq materiallar bo'yicha parvoz ma'lumotlari faqat Saffire IV–VI va SoFIE'da bor."],
    "gapf.bat": ["Battery thermal runaway is not covered by PSI combustion investigations.", "Тепловой разгон аккумуляторов не охвачен исследованиями горения PSI.", "Akkumulyatorlarning issiqlik bilan ishdan chiqishi PSI yonish tadqiqotlarida qamrab olinmagan."],
    "it.match0": ["It was tested inside the {s} atmosphere ({o2}% O₂, {p} kPa), so its results apply directly.", "Испытания проводились в атмосфере миссии «{s}» ({o2}% O₂, {p} кПа), поэтому результаты применимы напрямую.", "U {s} atmosferasida sinalgan ({o2}% O₂, {p} kPa), shuning uchun natijalari to'g'ridan-to'g'ri qo'llanadi."],
    "it.match1": ["It was tested near, but not at, the {s} atmosphere; results need modest extrapolation.", "Испытания проводились рядом с атмосферой миссии «{s}», но не в ней; нужна небольшая экстраполяция.", "U {s} atmosferasiga yaqin, lekin aynan unda sinalmagan; natijalar biroz ekstrapolyatsiyani talab qiladi."],
    "it.match2": ["It was tested far from the {s} atmosphere ({io2}% O₂, {ip} kPa vs {o2}% / {p} kPa); treat results as trends, not numbers.", "Испытания проводились далеко от атмосферы миссии «{s}» ({io2}% O₂, {ip} кПа против {o2}% / {p} кПа); используйте результаты как тенденции, а не как числа.", "U {s} atmosferasidan uzoqda sinalgan ({io2}% O₂, {ip} kPa va {o2}% / {p} kPa); natijalarni raqam emas, tendensiya sifatida qabul qiling."],
    "it.head": ["**{name} for {s}.** {m}", "**{name} для миссии «{s}».** {m}", "**{name}: {s} uchun.** {m}"],
    "it.key": ["Key result: {f}", "Главный результат: {f}", "Asosiy natija: {f}"],
    "it.limit": ["Limit: flown in microgravity, while this mission runs at {g} g. Partial-gravity behaviour is not yet measured.", "Ограничение: эксперимент проводился в микрогравитации, а миссия работает при {g} g. Поведение при частичной гравитации ещё не измерено.", "Cheklov: tajriba mikrogravitatsiyada o'tkazilgan, missiya esa {g} g'da ishlaydi. Qisman gravitatsiyadagi xatti-harakat hali o'lchanmagan."],

    // chunk glue for retrieval
    "ch.objective": ["Objective", "Цель", "Maqsad"],
    "ch.fuels": ["Fuels", "Топливо", "Yoqilg'i"],
    "ch.cond": ["Conditions: O₂ {o2}%, pressure {p} kPa, flow {f} cm/s.", "Условия: O₂ {o2}%, давление {p} кПа, поток {f} см/с.", "Sharoit: O₂ {o2}%, bosim {p} kPa, oqim {f} sm/s."],
    "ch.diag": ["Diagnostics", "Диагностика", "O'lchov asboblari"],
    "ch.finding": ["finding", "результат", "natija"],
    "ch.impl": ["fire-safety implication for {k}", "значение для: {k}", "{k} uchun ahamiyati"],
    "ch.gap": ["Research gap", "Пробел в исследованиях", "Tadqiqot bo'shlig'i"],
    "ch.atm": ["{s} atmosphere: {o2}% O₂ at {p} kPa ({psia} psia), gravity {g} g. {note}", "Атмосфера «{s}»: {o2}% O₂ при {p} кПа ({psia} psia), гравитация {g} g. {note}", "{s} atmosferasi: {p} kPa'da {o2}% O₂ ({psia} psia), gravitatsiya {g} g. {note}"],
    "ch.earth": ["Earth benefit", "Польза для Земли", "Yer uchun foyda"],
    "ch.action": ["Action", "Действие", "Tavsiya"],
    "cite.ATM": ["atmosphere", "атмосфера", "atmosfera"],
    "cite.GAP": ["research gap", "пробел", "bo'shliq"],
    "cite.HIST": ["history", "история", "tarix"],
    "cite.PHYS": ["physics", "физика", "fizika"],
    "cite.INSIGHT": ["insight", "вывод", "xulosa"],
    "cite.EARTH": ["Earth benefit", "польза для Земли", "Yer uchun foyda"],
    "cite.GENERAL": ["general knowledge, not NASA data", "общие знания, не данные NASA", "umumiy bilim, NASA ma'lumoti emas"],
    "cite.GENERALtip": ["Not found in the NASA sources VULKAN retrieved; general scientific knowledge, check before relying on it.", "Не найдено в источниках NASA, которые нашёл VULKAN; это общие научные знания, проверьте перед использованием.", "VULKAN topgan NASA manbalarida yo'q; bu umumiy ilmiy bilim, ishonishdan oldin tekshiring."],
    "cite.NTRS": ["NASA report {y}", "отчёт NASA {y}", "NASA hisoboti {y}"],
    "ask.sources": ["NASA technical reports cited", "Цитируемые технические отчёты NASA", "Iqtibos keltirilgan NASA texnik hisobotlari"],
    "ask.searched": ["Live NTRS search: {n} NASA reports match “{q}”.", "Поиск в NTRS: {n} отчётов NASA по запросу «{q}».", "NTRS qidiruvi: “{q}” bo'yicha {n} ta NASA hisoboti topildi."],
    "kb.base": ["<b>Knowledge base:</b> {inv} curated NASA investigations and {ins} cross-study insights.", "<b>База знаний:</b> {inv} отобранных исследований NASA и {ins} сквозных выводов.", "<b>Bilim bazasi:</b> {inv} ta tanlangan NASA tadqiqoti va {ins} ta umumlashtirilgan xulosa."],
    "kb.ntrs": ["Each AI answer also searches the NASA Technical Reports Server live: {mc} reports on microgravity combustion, {sf} on spacecraft fire, {fl} on flammability, {fs} on fire suppression and {sd} on smoke detection.", "Каждый ответ AI также ищет в NASA Technical Reports Server: {mc} отчётов о горении в микрогравитации, {sf} о пожарах на кораблях, {fl} о горючести, {fs} о пожаротушении и {sd} об обнаружении дыма.", "Har bir AI javobi NASA Technical Reports Server'dan ham qidiradi: mikrogravitatsiyada yonish bo'yicha {mc}, kemadagi yong'in bo'yicha {sf}, yonuvchanlik bo'yicha {fl}, yong'inni o'chirish bo'yicha {fs} va tutunni aniqlash bo'yicha {sd} ta hisobot."],
    "kb.ntrs3": ["Each AI answer also searches the NASA Technical Reports Server live: {mc} reports on microgravity combustion, {sf} on spacecraft fire and {fl} on flammability.", "Каждый ответ AI также ищет в NASA Technical Reports Server: {mc} отчётов о горении в микрогравитации, {sf} о пожарах на кораблях и {fl} о горючести.", "Har bir AI javobi NASA Technical Reports Server'dan ham qidiradi: mikrogravitatsiyada yonish bo'yicha {mc}, kemadagi yong'in bo'yicha {sf} va yonuvchanlik bo'yicha {fl} ta hisobot."],
    "kb.ntrsLive": ["Each AI answer also searches the NASA Technical Reports Server live.", "Каждый ответ AI также ищет в NASA Technical Reports Server.", "Har bir AI javobi NASA Technical Reports Server'dan ham qidiradi."],
    "cite.MODEL": ["VULKAN model", "модель VULKAN", "VULKAN modeli"],
    "cite.MODEL1": ["how the model works", "устройство модели", "model qanday ishlaydi"],
    "cite.MODEL2": ["model check", "проверка модели", "model tekshiruvi"],
    "cite.MODEL3": ["FM2 prediction", "прогноз FM2", "FM2 bashorati"],
    "cite.MAT": ["NASA material data", "данные NASA о материале", "NASA material ma'lumoti"],
    "ch.anchorMoc": ["NASA upward-burning limit (NASA-STD-6001 Test 1 MOC) {o2}% O₂ at {psia} psia, from {src}", "предел NASA при горении снизу вверх (NASA-STD-6001 Test 1, MOC) {o2}% O₂ при {psia} psia, источник: {src}", "NASA'ning pastdan yuqoriga yonish chegarasi (NASA-STD-6001 Test 1, MOC) {psia} psia'da {o2}% O₂, manba: {src}"],
    "ch.anchorEst": ["estimated NASA upward-burning limit {o2}% O₂ at {psia} psia, from {src}, with a wider range", "оценка предела NASA при горении снизу вверх {o2}% O₂ при {psia} psia, источник: {src}, диапазон шире", "NASA'ning pastdan yuqoriga yonish chegarasi bahosi {psia} psia'da {o2}% O₂, manba: {src}, oraliq kengroq"],
    "ch.anchorLoi": ["no NASA upward-burning limit found, so VULKAN uses the Limiting Oxygen Index of {o2}% (unverified, wider range)", "предел NASA при горении снизу вверх не найден, поэтому VULKAN использует кислородный индекс {o2}% (не проверено, диапазон шире)", "NASA'ning pastdan yuqoriga yonish chegarasi topilmadi, shuning uchun VULKAN {o2}% kislorod indeksini ishlatadi (tekshirilmagan, oraliq kengroq)"],
    "ch.matTitle": ["Material oxygen limit: {m}", "Кислородный предел материала: {m}", "Materialning kislorod chegarasi: {m}"],
    "ch.mat": ["{m}: {anchor}. {note} VULKAN's limit at 1 g and sea level: {l1}%. In a lunar habitat (30% O₂, 10.2 psia, 0.166 g): {lm}%, {st}.", "{m}: {anchor}. {note} Предел VULKAN при 1 g на уровне моря: {l1}%. На лунной базе (30% O₂, 10,2 psia, 0,166 g): {lm}%, {st}.", "{m}: {anchor}. {note} VULKAN chegarasi 1 g va dengiz sathida: {l1}%. Oy bazasida (30% O₂, 10,2 psia, 0,166 g): {lm}%, {st}."],
    "ch.m1Title": ["How the VULKAN flammability model works", "Как устроена модель горючести VULKAN", "VULKAN yonuvchanlik modeli qanday ishlaydi"],
    "ch.m1": ["VULKAN's flammability model is a transparent screening model built only from NASA measurements. It starts from NASA's own upward-burning limit for each material (NASA-STD-6001 Test 1, NASA White Sands) at the pressure NASA measured it. Lower pressure raises the limit by about 0.6 points per psi (NASA White Sands rule). In microgravity the lowest limit is 2.4 points below the 1 g limit (BASS-II); very slow flow quenches the flame and very fast flow blows it off (BASS-II fabric tests). At lunar or Mars gravity, buoyant flow feeds the flame and part of the 1 g penalty returns, so partial gravity is close to the worst case. Every estimate shows a likely range. It is a screening tool, not NASA-STD-6001 certification.", "Модель горючести VULKAN — прозрачная оценочная модель, построенная только на измерениях NASA. Она начинает с предела NASA для каждого материала при горении снизу вверх (NASA-STD-6001 Test 1, NASA White Sands) при том давлении, при котором его измерили. Понижение давления повышает предел примерно на 0,6 пункта на psi (правило NASA White Sands). В микрогравитации наименьший предел на 2,4 пункта ниже предела при 1 g (BASS-II); очень слабый поток гасит пламя, а очень сильный сдувает его (опыты BASS-II с тканью). При лунной или марсианской гравитации конвекция подпитывает пламя и часть поправки 1 g возвращается, поэтому частичная гравитация близка к наихудшему случаю. Каждая оценка показывает вероятный диапазон. Это инструмент скрининга, а не сертификация по NASA-STD-6001.", "VULKAN yonuvchanlik modeli faqat NASA o'lchovlariga asoslangan shaffof baholash modeli. U har bir material uchun NASA'ning pastdan yuqoriga yonish chegarasidan (NASA-STD-6001 Test 1, NASA White Sands) NASA o'lchagan bosimda boshlanadi. Bosim pasaysa, chegara har bir psi uchun taxminan 0,6 punktga oshadi (NASA White Sands qoidasi). Mikrogravitatsiyada eng past chegara 1 g dagidan 2,4 punkt past (BASS-II); juda sekin oqim alangani so'ndiradi, juda tez oqim esa uni uchirib yuboradi (BASS-II mato sinovlari). Oy yoki Mars gravitatsiyasida ko'tarilish oqimi alangani oziqlantiradi va 1 g tuzatmasining bir qismi qaytadi, shuning uchun qisman gravitatsiya eng yomon holatga yaqin. Har bir baho ehtimoliy oraliqni ko'rsatadi. Bu NASA-STD-6001 sertifikatsiyasi emas, balki dastlabki baholash vositasi."],
    "ch.m2Title": ["Model accuracy: how VULKAN's fire model was checked against NASA measurements", "Точность модели: как модель VULKAN проверили по измерениям NASA", "Model aniqligi: VULKAN modeli NASA o'lchovlari bilan qanday tekshirilgan"],
    "ch.m2": ["VULKAN's model was checked against {n} NASA measurements: White Sands upward-burning limits and BASS, BASS-II and SSCE results in orbit. The first version, calibrated to the Limiting Oxygen Index, made {v1u} unsafe misses (it called a material safe where NASA saw it burn) and got {v1o} right. The current version, anchored to NASA test data, gets {v2o} right, with {v2u} unsafe misses and {v2c} too cautious. {nt} of the checks set model constants and {ni} are independent. Example: Kapton film's oxygen index is 37%, but NASA's upward-burning limit is 26%, so the first version wrongly called Kapton safe in Moon-base air.", "Модель VULKAN проверили по {n} измерениям NASA: пределам горения снизу вверх из White Sands и результатам BASS, BASS-II и SSCE на орбите. Первая версия, откалиброванная по кислородному индексу, дала {v1u} опасных промахов (называла материал безопасным там, где NASA видело горение) и {v1o} верных ответов. Текущая версия, привязанная к данным испытаний NASA, даёт {v2o} верных ответов, {v2u} опасных промахов и {v2c} излишне осторожных. {nt} проверок задавали константы модели, {ni} независимы. Пример: кислородный индекс плёнки каптон — 37%, а предел NASA при горении снизу вверх — 26%, поэтому первая версия ошибочно считала каптон безопасным в атмосфере лунной базы.", "VULKAN modeli NASA'ning {n} ta o'lchovi bilan tekshirilgan: White Sands'dagi pastdan yuqoriga yonish chegaralari hamda orbitadagi BASS, BASS-II va SSCE natijalari. Kislorod indeksiga moslangan birinchi versiya {v1u} ta xavfli xato qilgan (NASA yonganini ko'rgan materialni xavfsiz degan) va {v1o} ta to'g'ri javob bergan. NASA sinov ma'lumotlariga bog'langan hozirgi versiya {v2o} ta to'g'ri, {v2u} ta xavfli xato va {v2c} ta ortiqcha ehtiyotkor natija beradi. Tekshiruvlardan {nt} tasi model konstantalarini belgilagan, {ni} tasi mustaqil. Misol: Kapton plyonkasining kislorod indeksi 37%, NASA'ning pastdan yuqoriga yonish chegarasi esa 26%, shuning uchun birinchi versiya Kaptonni Oy bazasi havosida noto'g'ri xavfsiz degan."],
    "ch.m3Title": ["VULKAN's pre-registered predictions for NASA's FM2 Moon experiment", "Заранее зафиксированные прогнозы VULKAN для эксперимента NASA FM2 на Луне", "VULKAN'ning NASA FM2 Oy tajribasi uchun oldindan muhrlangan bashoratlari"],
    "ch.m3": ["VULKAN's predictions for NASA's FM2 experiment were frozen on {d}, before FM2 flies. FM2 will burn fabric samples upward in lunar gravity at 8.2 psia with 37, 33, 29 and 25% O₂. {lines} NASA expects its test fabric to have a lunar limit of 24–26% O₂ and the 25% test not to ignite (Ferkul, LPSC 2026).", "Прогнозы VULKAN для эксперимента NASA FM2 зафиксированы {d}, до полёта FM2. FM2 сожжёт образцы ткани снизу вверх при лунной гравитации, 8,2 psia и 37, 33, 29 и 25% O₂. {lines} NASA ожидает, что лунный предел её ткани 24–26% O₂ и при 25% она не загорится (Ferkul, LPSC 2026).", "VULKAN'ning NASA FM2 tajribasi uchun bashoratlari {d} da, FM2 uchishidan oldin muhrlangan. FM2 mato namunalarini Oy gravitatsiyasida, 8,2 psia'da 37, 33, 29 va 25% O₂ bilan pastdan yuqoriga yoqadi. {lines} NASA o'z sinov matosining Oydagi chegarasi 24–26% O₂ bo'lishini va 25% sinovda yonmasligini kutmoqda (Ferkul, LPSC 2026)."],
    "ch.m3line": ["{m}: predicted lunar limit {x}% (range {lo}–{hi}%); {calls}.", "{m}: прогноз лунного предела {x}% (диапазон {lo}–{hi}%); {calls}.", "{m}: Oydagi chegara bashorati {x}% (oraliq {lo}–{hi}%); {calls}."],
    "ai.valHead": ["**How accurate VULKAN's fire model is**", "**Насколько точна модель горючести VULKAN**", "**VULKAN yonuvchanlik modeli qanchalik aniq**"],
    "ai.val1": ["Checked against {n} NASA measurements (White Sands upward-burning limits and BASS, BASS-II and SSCE results in orbit): **{v2o} correct, {v2u} unsafe misses, {v2c} too cautious**.", "Проверено по {n} измерениям NASA (пределы горения снизу вверх из White Sands и результаты BASS, BASS-II и SSCE на орбите): **{v2o} верно, {v2u} опасных промахов, {v2c} излишне осторожно**.", "NASA'ning {n} ta o'lchovi bilan tekshirilgan (White Sands'dagi pastdan yuqoriga yonish chegaralari, orbitadagi BASS, BASS-II va SSCE natijalari): **{v2o} ta to'g'ri, {v2u} ta xavfli xato, {v2c} ta ortiqcha ehtiyotkor**."],
    "ai.val2": ["The first version, calibrated to the Limiting Oxygen Index, had {v1u} unsafe misses. Kapton film is the clearest case: oxygen index 37%, NASA upward-burning limit 26%.", "Первая версия, откалиброванная по кислородному индексу, дала {v1u} опасных промахов. Самый ясный пример — плёнка каптон: кислородный индекс 37%, предел NASA при горении снизу вверх 26%.", "Kislorod indeksiga moslangan birinchi versiya {v1u} ta xavfli xato qilgan. Eng aniq misol Kapton plyonkasi: kislorod indeksi 37%, NASA'ning pastdan yuqoriga yonish chegarasi 26%."],
    "ai.val3": ["{nt} checks set model constants and {ni} are independent. The cautious calls come from narrow BASS samples; Moon and Mars values stay extrapolations until FM2 and FLARE report.", "{nt} проверок задавали константы, {ni} независимы. Излишне осторожные оценки связаны с узкими образцами BASS; значения для Луны и Марса остаются экстраполяцией до результатов FM2 и FLARE.", "{nt} ta tekshiruv konstantalarni belgilagan, {ni} tasi mustaqil. Ortiqcha ehtiyotkor natijalar BASS'ning tor namunalaridan kelib chiqadi; Oy va Mars qiymatlari FM2 va FLARE natijalari chiqquncha ekstrapolyatsiya bo'lib qoladi."],
    "ai.val4": ["The full table, with a NASA source for every row, is in {tab} under “{panel}”.", "Полная таблица с источником NASA для каждой строки: раздел «{tab}», блок «{panel}».", "Har bir qatori NASA manbasiga ega to'liq jadval “{tab}” bo'limidagi “{panel}” blokida."],
    "sp.val": ["Checked against {n} NASA measurements: {v2o} correct, {v2u} unsafe misses and {v2c} too cautious.", "Проверено по {n} измерениям NASA: {v2o} верно, {v2u} опасных промахов, {v2c} излишне осторожно.", "NASA'ning {n} ta o'lchovi bilan tekshirilgan: {v2o} ta to'g'ri, {v2u} ta xavfli xato, {v2c} ta ortiqcha ehtiyotkor."],
    "ai.fmHead": ["**VULKAN's predictions for NASA's FM2 Moon test** (frozen {d}, before FM2 flies):", "**Прогнозы VULKAN для опыта NASA FM2 на Луне** (зафиксированы {d}, до полёта FM2):", "**VULKAN'ning NASA FM2 Oy sinovi uchun bashoratlari** ({d} da, FM2 uchishidan oldin muhrlangan):"],
    "ai.fmSetup": ["FM2 burns fabric upward in lunar gravity at 8.2 psia with 37, 33, 29 and 25% O₂.", "FM2 сжигает ткань снизу вверх при лунной гравитации, 8,2 psia и 37, 33, 29 и 25% O₂.", "FM2 matoni Oy gravitatsiyasida, 8,2 psia'da 37, 33, 29 va 25% O₂ bilan pastdan yuqoriga yoqadi."],
    "ai.fmNasa": ["NASA expects its test fabric to have a lunar limit of 24–26% O₂ and the 25% test not to ignite; VULKAN's Nomex limit, {x}%, falls inside that window.", "NASA ожидает лунный предел своей ткани 24–26% O₂ и что при 25% она не загорится; предел Nomex по VULKAN, {x}%, попадает в это окно.", "NASA o'z sinov matosining Oydagi chegarasi 24–26% O₂ bo'lishini va 25% sinovda yonmasligini kutmoqda; VULKAN bo'yicha Nomex chegarasi {x}% shu oraliqqa tushadi."],
    "ai.fmTest": ["If FM2 sees Nomex burn at 25% or go out at 29%, VULKAN's partial-gravity term is wrong, and we will correct it in public.", "Если в FM2 Nomex загорится при 25% или погаснет при 29%, член модели для частичной гравитации неверен, и мы публично его исправим.", "Agar FM2'da Nomex 25% da yonsa yoki 29% da o'chsa, VULKAN'ning qisman gravitatsiya qismi noto'g'ri bo'ladi va biz uni ochiq tuzatamiz."],
    "sp.fm": ["VULKAN predicts a lunar limit of {x} percent oxygen for {m}, inside NASA's expected window of 24 to 26 percent.", "VULKAN прогнозирует для {m} лунный предел {x} процента кислорода, внутри ожидаемого NASA окна от 24 до 26 процентов.", "VULKAN {m} uchun Oydagi chegarani {x} foiz kislorod deb bashorat qiladi, bu NASA kutayotgan 24 dan 26 foizgacha oraliqda."],
    "ai.model3": ["1 g anchor: {anchor}.", "Опора при 1 g: {anchor}.", "1 g dagi tayanch: {anchor}."],
    "rp.button": ["Save report (PDF)", "Сохранить отчёт (PDF)", "Hisobotni saqlash (PDF)"],
    "rp.title": ["Fire-risk report", "Отчёт о пожарном риске", "Yong'in xavfi hisoboti"],
    "rp.meta": ["{date} · {m} · {o2}% O₂ at {p} kPa ({psia} psia) · gravity {g} · ventilation {v} cm/s", "{date} · {m} · {o2}% O₂ при {p} кПа ({psia} psia) · гравитация {g} · вентиляция {v} см/с", "{date} · {m} · {p} kPa'da {o2}% O₂ ({psia} psia) · gravitatsiya {g} · ventilyatsiya {v} sm/s"],
    "rp.foot": ["A screening estimate built from NASA data, not NASA-STD-6001 certification. Model, sources and the full NASA check: {url}", "Оценка для скрининга по данным NASA, а не сертификация по NASA-STD-6001. Модель, источники и полная проверка по данным NASA: {url}", "NASA ma'lumotlari asosidagi dastlabki baho, NASA-STD-6001 sertifikatsiyasi emas. Model, manbalar va NASA bilan to'liq tekshiruv: {url}"],
    "gp.refsModel": ["Sources for the flammability model and its NASA check", "Источники модели горючести и её проверки по данным NASA", "Yonuvchanlik modeli va uning NASA tekshiruvi manbalari"],
  };

  const SUGGEST = {
    en: ["Which investigations matter most for a lunar habitat?", "How accurate is VULKAN's fire model?", "What does VULKAN predict for NASA's FM2 Moon test?", "Is Nomex flammable at 34% oxygen and 8.2 psi on the Moon?", "Why don't Earth extinguisher standards apply in microgravity?", "Compare BASS and Saffire", "What did SAME learn about smoke detectors?", "What are cool flames and why are they dangerous?", "What research gaps remain for Mars missions?"],
    ru: ["Какие исследования наиболее важны для лунного модуля?", "Насколько точна модель горючести VULKAN?", "Что VULKAN предсказывает для опыта NASA FM2 на Луне?", "Горит ли Nomex при 34% кислорода и 8,2 psi на Луне?", "Почему земные нормы для огнетушителей не работают в микрогравитации?", "Сравни BASS и Saffire", "Что SAME выяснил о датчиках дыма?", "Что такое холодное пламя и чем оно опасно?", "Какие пробелы в исследованиях остаются для полётов на Марс?"],
    uz: ["Oy moduli uchun qaysi tadqiqotlar eng muhim?", "VULKAN yonuvchanlik modeli qanchalik aniq?", "VULKAN NASA'ning FM2 Oy sinovi uchun nimani bashorat qiladi?", "Oyda 34% kislorod va 8,2 psi'da Nomex yonadimi?", "Nega Yerdagi o't o'chirgich me'yorlari mikrogravitatsiyada ishlamaydi?", "BASS va Saffire'ni taqqosla", "SAME tutun datchiklari haqida nimani aniqladi?", "Sovuq alanga nima va u nega xavfli?", "Mars missiyalari uchun qanday tadqiqot bo'shliqlari qolgan?"],
  };

  function detect() {
    try { const s = JSON.parse(localStorage.getItem("vulkan:lang")); if (IDX.hasOwnProperty(s)) return s; } catch (e) { /* ignore */ }
    const n = ((typeof navigator !== "undefined" && navigator.language) || "en").toLowerCase();
    return n.startsWith("ru") ? "ru" : n.startsWith("uz") ? "uz" : "en";
  }
  const IDX = { en: 0, ru: 1, uz: 2 };
  E.lang = "en";

  E.t = function (key, vars) {
    const row = UI[key];
    let s = row ? row[IDX[E.lang]] || row[0] : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  };
  E.suggestions = () => SUGGEST[E.lang] || SUGGEST.en;
  // localised number formatting for decimals in prose (ru/uz use a decimal comma)
  E.num = (v, d = 1) => { const s = Number(v).toFixed(d); return E.lang === "en" ? s : s.replace(".", ","); };
  // same, for a raw value whose decimals should be kept as they are (e.g. 101.3, 0.166)
  E.fmt = (v) => (E.lang === "en" ? String(v) : String(v).replace(".", ","));
  // whole numbers with a thousands separator: 2,250 in English, 2 250 in Russian and Uzbek (a comma is their decimal mark)
  E.int = (v) => String(Math.round(Number(v) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, E.lang === "en" ? "," : "\u00a0");

  /* ---------- content localisation ---------- */
  let ORIG = null;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function snapshot() {
    ORIG = {
      INVESTIGATIONS: clone(E.INVESTIGATIONS), INSIGHTS: clone(E.INSIGHTS), GAPS: clone(E.GAPS), SPINOFFS: clone(E.SPINOFFS),
      INCIDENTS: clone(E.INCIDENTS), SCENARIOS: clone(E.SCENARIOS), MATERIALS: clone(E.MATERIALS), REF_ATMOS: clone(E.REF_ATMOS),
      PRIMER: clone(E.PRIMER), CATEGORIES: clone(E.CATEGORIES),
    };
  }
  function overlay(list, tr, keyOf) {
    return list.map((item, i) => {
      const o = tr && tr[keyOf(item, i)];
      if (!o) return item;
      const out = { ...item };
      Object.keys(o).forEach((k) => {
        if (k === "implications") out.implications = { ...item.implications, ...o.implications };
        else out[k] = o[k];
      });
      return out;
    });
  }
  E.setLang = function (lang) {
    if (!IDX.hasOwnProperty(lang)) lang = "en";
    if (!ORIG) snapshot();
    E.lang = lang;
    try { localStorage.setItem("vulkan:lang", JSON.stringify(lang)); } catch (e) { /* ignore */ }
    if (typeof document !== "undefined") document.documentElement.lang = lang;
    const L = (E.L10N && E.L10N[lang]) || {};
    E.INVESTIGATIONS = overlay(clone(ORIG.INVESTIGATIONS), L.inv, (x) => x.id);
    E.INSIGHTS = overlay(clone(ORIG.INSIGHTS), L.ins, (x) => x.rank);
    E.GAPS = overlay(clone(ORIG.GAPS), L.gap, (x, i) => i);
    E.SPINOFFS = overlay(clone(ORIG.SPINOFFS), L.spin, (x, i) => i);
    E.INCIDENTS = overlay(clone(ORIG.INCIDENTS), L.inc, (x, i) => i);
    E.SCENARIOS = overlay(clone(ORIG.SCENARIOS), L.scen, (x) => x.id);
    E.MATERIALS = overlay(clone(ORIG.MATERIALS), L.mat, (x) => x.id);
    E.REF_ATMOS = overlay(clone(ORIG.REF_ATMOS), L.ref, (x) => x.id);
    E.PRIMER = overlay(clone(ORIG.PRIMER), L.prim, (x, i) => i);
    const cats = clone(ORIG.CATEGORIES);
    if (L.cat) Object.keys(L.cat).forEach((k) => cats[k] && (cats[k].label = L.cat[k]));
    E.CATEGORIES = cats;
  };
  E.initLang = function () { E.setLang(detect()); };
  // the English record of an investigation, for search in any language
  E.origInv = (id) => ((ORIG && ORIG.INVESTIGATIONS) || E.INVESTIGATIONS).find((i) => i.id === id);
})();
