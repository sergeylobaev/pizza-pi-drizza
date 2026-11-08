/**
 * Pizza Pi Drizza — Interactive Application Logic
 * Audio Synthesis, Recipe Modals, Dough Calculator, Route Map, Guestbook
 */

// ===================================================================
// 1. Web Audio API Fireplace / Cozy Hearth Sound Generator
// ===================================================================
class FireplaceAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.gainNode = null;
    this.intervalId = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master volume gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);
  }

  start() {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;

    // Create continuous low-frequency warm rumble (pink/brown noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      output[i] = (b0 + b1 + b2) * 0.18;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to warm bass-mid crackle
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start(0);
    this.rumbleSource = whiteNoise;

    // Random wood pops and snaps
    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;
      if (Math.random() > 0.3) {
        this.triggerWoodPop();
      }
    }, 180);
  }

  triggerWoodPop() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();

    // Pitch envelope of a dry wood snap
    const baseFreq = 800 + Math.random() * 1400;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

    // Sharp attack, quick decay
    const volume = 0.08 + Math.random() * 0.22;
    popGain.gain.setValueAtTime(volume, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(popGain);
    popGain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.rumbleSource) {
      try { this.rumbleSource.stop(); } catch (e) {}
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }
}

const fireplace = new FireplaceAudio();

// ===================================================================
// 2. Pizza Database (Detailed Recipes & Car Legends)
// ===================================================================
const PIZZA_DATA = {
  'tuscan': {
    id: 'tuscan',
    name: 'Тосканский Кирпич',
    alias: 'The Tuscan Brick',
    category: 'legendary',
    price: '790 ₽',
    country: 'Италия, Тоскана',
    car: 'Volvo 240 (1984)',
    image: 'images/pizza-tuscan.jpg',
    tagline: '«Когда кипит радиатор — самое время ставить опару»',
    story: 'Родилась на обочине холмов Сан-Джиминьяно, когда наш старый красный Volvo 240 закипел прямо под сенью кипарисов. Пока Сергей остужал термостат колодезной водой, пожилая синьора Роза вынесла нам домашнюю закваску, миску спелых сливовидных томатов Сан-Марцано и нежнейшую сливочную страчателлу. Запекли в её дровяной печи — с тех пор это основа нашей пиццерии.',
    cookTime: '90 секунд при 450°C',
    hydration: '68% на закваске Biga',
    proTip: 'Сергей советует: «Выпекайте на максимальной температуре до появления леопардовых подпалин на бортике, а страчателлу и свежий базилик выкладывайте только после того, как достали пиццу из печи!»',
    ingredients: [
      { name: 'Мука пшеничная Tipo 00 (Caputo)', amount: '160 г' },
      { name: 'Вода родниковая ледяная', amount: '110 мл' },
      { name: 'Закваска / Biga (72 ч ферментации)', amount: '35 г' },
      { name: 'Томаты San Marzano D.O.P. (размятые руками)', amount: '90 г' },
      { name: 'Страчателла из коровьего молока', amount: '80 г' },
      { name: 'Чесночное конфи в оливковом масле', amount: '15 г' },
      { name: 'Свежий зеленый базилик', amount: '5 листочков' },
      { name: 'Хлопья морской соли и масло EVOO', amount: 'по вкусу' }
    ],
    steps: [
      {
        title: 'Растяжка основы (без скалки!)',
        desc: 'Припылите рабочую поверхность семолой. Аккуратно пальцами сформируйте круг диаметром 28-30 см, бережно выдавливая пузырьки воздуха из центра в бортики.'
      },
      {
        title: 'Томатная основа и чесночный конфи',
        desc: 'Нанесите томаты круговыми движениями от центра, оставляя нетронутыми 2 см пышного бортика. Распределите дольки чесночного конфи.'
      },
      {
        title: 'Жар печи',
        desc: 'Переложите пиццу на перфорированную лопату и отправьте в печь (или на раскаленный камень в духовке на максимум). Выпекайте 90-120 секунд, дважды повернув лопатой.'
      },
      {
        title: 'Венчание вкуса',
        desc: 'Сразу после выемки разложите прохладную шелковистую страчателлу, свежий базилик и сбрызните ароматным оливковым маслом первого отжима.'
      }
    ]
  },

  'greece': {
    id: 'greece',
    name: 'Одиссея Т2',
    alias: 'Peloponnesian Coast',
    category: 'legendary',
    price: '840 ₽',
    country: 'Греция, Пелопоннес',
    car: 'VW T2 Bus (1978)',
    image: 'images/pizza-greece.jpg',
    tagline: '«Обмен ремня генератора на бочонок оливок Каламата»',
    story: 'На серпантине над Коринфским заливом желтый кемпер T2 застучал ремнем генератора. На помощь пришел местный фермер Никос на старом пикапе. Дима нашел в багажнике запасной ремень от «Вольво», а Никос в благодарность подарил нам пятилитровый бидон свежеотжатого оливкового масла, бочковую овечью фету и пучок дикого горного орегано, собранного на рассвете.',
    cookTime: '100 секунд при 440°C',
    hydration: '67% с оливковым маслом',
    proTip: 'Дима замечает: «Оливки Каламата ни в коем случае нельзя резать комбайном — только давить плоской стороной ножа, чтобы сохранить их бархатистую маслянистость и сок!»',
    ingredients: [
      { name: 'Мука Tipo 00', amount: '160 г' },
      { name: 'Греческая овечья фета (выдержка в бочке)', amount: '70 г' },
      { name: 'Оливки Kalamata без косточек (раздавленные)', amount: '45 г' },
      { name: 'Печеный сладкий перец Флорина', amount: '50 г' },
      { name: 'Карамелизованный красный лук', amount: '30 г' },
      { name: 'Дикий горный орегано и тимьян', amount: '1 ч. л.' },
      { name: 'Цедра лимона и каперсы', amount: '10 г' },
      { name: 'Моцарелла fior di latte', amount: '60 г' }
    ],
    steps: [
      {
        title: 'Подготовка овощной подушки',
        desc: 'Перец запекается на углях до обугливания кожицы, очищается и нарезается полосками. Лук томится с каплей бальзамика.'
      },
      {
        title: 'Сырная мозаика',
        desc: 'Основу смазать маслом с диким орегано, рассыпать fior di latte, перцы, лук и темные мясистые оливки.'
      },
      {
        title: 'Выпекание на раскаленном шамоте',
        desc: 'Выпекайте до хруста и золотистости. Фета в печи становится кремовой, но не плавится в жидкую массу.'
      },
      {
        title: 'Финальный акцент моря',
        desc: 'Посыпьте свежей тертой цедрой лимона и хрустящими каперсами — этот контраст перенесет вас прямо на берег Эгейского моря.'
      }
    ]
  },

  'caucasus': {
    id: 'caucasus',
    name: 'Кавказский Дрифт',
    alias: 'Georgian Highway Express',
    category: 'meat',
    price: '890 ₽',
    country: 'Грузия, Кавказ',
    car: 'Mercedes W124 (1991)',
    image: 'images/pizza-caucasus.jpg',
    tagline: '«Ночь на Крестовом перевале и огонь из буковых поленьев»',
    story: 'На Военно-Грузинской дороге на высоте 2379 метров наш универсал W124 встретил внезапный ночной снегопад. Застряв до рассвета, Семён достал чугунную сковороду, Сергей развел костер из буковых дров из багажника, а проезжавший мимо чабан угостил нас копченым сулугуни и острой абхазской аджикой. Получилось самое согревающее блюдо на свете.',
    cookTime: '90 секунд при 460°C',
    hydration: '70% с высокой пористостью',
    proTip: 'Семён делится секретом: «Кинзу и грецкий орех мы перетираем в ступке с зубчиком чеснока и капелькой винного уксуса. Этот соус бьет точно в сердце!»',
    ingredients: [
      { name: 'Тесто длительной ферментации', amount: '260 г' },
      { name: 'Копченый сулугуни (ручная нарезка)', amount: '80 г' },
      { name: 'Томленая говядина (рваные волокна)', amount: '90 г' },
      { name: 'Соус из грецких орехов и кинзы (баже)', amount: '40 г' },
      { name: 'Острая домашняя аджика', amount: '15 г' },
      { name: 'Фиолетовый базилик (реган)', amount: 'несколько веточек' },
      { name: 'Гранатовый соус наршараб', amount: '1 ст. л.' }
    ],
    steps: [
      {
        title: 'Сырный фундамент',
        desc: 'На растянутое тесто наносится тонкий слой сливочного соуса и щедрая стружка копченого сулугуни.'
      },
      {
        title: 'Мясо и пряный акцент',
        desc: 'Равномерно выкладываются сочные волокна томленой говядины и аккуратные капли пикантной аджики.'
      },
      {
        title: 'Огненная выпечка',
        desc: 'Отправляем в печь, где копченый сыр покрывается аппетитной румяной корочкой.'
      },
      {
        title: 'Кавказское изобилие',
        desc: 'Поливаем орехово-кинзовым песто, тонкими нитями наршараба и украшаем свежими листьями регана.'
      }
    ]
  },

  'taiga': {
    id: 'taiga',
    name: 'Таёжный Заповедник',
    alias: 'Siberian Forest Foraging',
    category: 'meat',
    price: '920 ₽',
    country: 'Алтай и Тайга',
    car: 'ВАЗ-2121 «Нива» (1988)',
    image: 'images/pizza-taiga.jpg',
    tagline: '«Лебедка, кедровые шишки и белые грибы под северным сиянием»',
    story: 'Тайга не прощает спешки. Когда «Нива» села на мосты в торфяном броде у реки Катунь, мы вытаскивали её ручной лебедкой четыре часа. Когда машина выбралась на сухой кедровый пригорок, вокруг были поляны золотых лисичек и крепких боровиков. Ужин у костра с жареными грибами и брусникой стал легендой нашей троицы.',
    cookTime: '110 секунд при 430°C',
    hydration: '66% с добавлением цельнозерновой муки',
    proTip: 'Сергей: «Лисички предварительно быстро обжариваются на сливочном масле с тимьяном ровно 2 минуты, чтобы отдать лишнюю влагу и не размочить хрустящую основу!»',
    ingredients: [
      { name: 'Основа с 10% ржано-пшеничной закваски', amount: '260 г' },
      { name: 'Белый соус на основе сливок и печеного чеснока', amount: '60 г' },
      { name: 'Свежие лесные лисички и белые грибы', amount: '90 г' },
      { name: 'Копченый бекон из дичи / панчетта', amount: '60 г' },
      { name: 'Обжаренные кедровые орешки', amount: '25 г' },
      { name: 'Дикая брусника (протертая с каплей меда)', amount: '20 г' },
      { name: 'Моцарелла и выдержанный сыр', amount: '70 г' },
      { name: 'Свежий лесной тимьян', amount: '3 веточки' }
    ],
    steps: [
      {
        title: 'Белый лесной соус',
        desc: 'Сливки 33% смешиваются с пюре из запеченного чеснока, щепоткой мускатного ореха и солью.'
      },
      {
        title: 'Сборка лесного богатства',
        desc: 'На соус выкладывается моцарелла, припущенные лисички, тончайшие слайсы бекона и веточки тимьяна.'
      },
      {
        title: 'Выпекание с ароматом дыма',
        desc: 'В дровяной печи бекон становится прозрачно-хрустящим, а грибы раскрывают землистый лесной дух.'
      },
      {
        title: 'Сибирский финальный штрих',
        desc: 'Посыпаем горячую пиццу золотистыми кедровыми орешками и ставим рубиновые капельки кисло-сладкой брусники.'
      }
    ]
  },

  'provence': {
    id: 'provence',
    name: 'Прованский Бриз',
    alias: 'Lavender Road Cruiser',
    category: 'cheese',
    price: '870 ₽',
    country: 'Франция, Прованс',
    car: 'Citroën DS 21 (1972)',
    image: 'images/pizza-provence.jpg',
    tagline: '«Когда гидравлика легла прямо на лавандовом поле»',
    story: 'На футуристичном Citroën «Богиня» отказал регулятор давления гидроподвески, и мы мягко опустились на брюхо посреди фиолетовых просторов плато Валансоль. Местный пасечник Жан-Поль привез домкрат, а его жена угостила нас молодым козьим сыром шевр, домашним инжирным джемом и свежайшим лавандовым медом.',
    cookTime: '90 секунд при 450°C',
    hydration: '68% тончайшая хрустящая основа',
    proTip: 'Дима: «Лавандовый мед добавляйте тончайшей нитью прямо перед подачей — тепло сыра раскроет цветочный аромат, но не перебьет соленую ноту прошутто!»',
    ingredients: [
      { name: 'Пшеничное тесто длительной ферментации', amount: '250 г' },
      { name: 'Конфитюр из спелого инжира', amount: '45 г' },
      { name: 'Французский козий сыр Шевр (Chèvre)', amount: '60 г' },
      { name: 'Сыр Горгонзола Дольче', amount: '40 г' },
      { name: 'Прошутто ди Парма (выдержка 18 мес.)', amount: '50 г' },
      { name: 'Дикая свежая рукола', amount: '30 г' },
      { name: 'Цветочный лавандовый мед', amount: '1 ч. л.' },
      { name: 'Лепестки грецкого ореха', amount: '15 г' }
    ],
    steps: [
      {
        title: 'Сладковато-пряная база',
        desc: 'Тонко растяните тесто. Нанесите слой инжирного конфитюра точечными мазками.'
      },
      {
        title: 'Сырный дуэт',
        desc: 'Разложите кусочки нежного козьего шевра и кремовой горгонзолы, слегка припорошите моцареллой.'
      },
      {
        title: 'Краткий визит в пламя',
        desc: 'Выпекайте 90 секунд до карамелизации сыров и аппетитных пузырей на бортиках.'
      },
      {
        title: 'Французский шик',
        desc: 'Украсьте тонкими волнами прошутто, россыпью свежей перечной руколы, орехами и каплями лавандового меда.'
      }
    ]
  },

  'margherita': {
    id: 'margherita',
    name: 'Золотая Маргарита',
    alias: 'Nonna Rosa Classic',
    category: 'veggie',
    price: '650 ₽',
    country: 'Неаполь, Италия',
    car: 'Школа Розы',
    image: 'images/pizza-margherita.jpg',
    tagline: '«Золотой эталон: мука, вода, томат, сыр, огонь»',
    story: 'Наша дань уважения великой неаполитанской традиции. Именно этот рецепт нам передала синьора Роза. Никаких компромиссов: только томаты с вулканических почв Везувия, буйволиная моцарелла, тертый овечий пекорино и свежий базилик.',
    cookTime: '80 секунд при 470°C',
    hydration: '70% нежнейшее облачное тесто',
    proTip: 'Семён: «Настоящая неаполитанская пицца должна легко складываться вчетверо — кошельком (a portafoglio), а бортик должен пружинить и быть невесомым!»',
    ingredients: [
      { name: 'Тесто Biga (мука Tipo 00)', amount: '260 г' },
      { name: 'Томаты San Marzano D.O.P.', amount: '80 г' },
      { name: 'Mozzarella di Bufala Campana D.O.P.', amount: '90 г' },
      { name: 'Pecorino Romano тертый', amount: '15 г' },
      { name: 'Свежий зеленый базилик', amount: '6 листочков' },
      { name: 'Оливковое масло первого холодного отжима', amount: '15 мл' }
    ],
    steps: [
      {
        title: 'Формовка диска',
        desc: 'Бережно распределите тесто, сохранив нетронутым пышный бортик высотой 2 см.'
      },
      {
        title: 'Томаты и овечий сыр',
        desc: 'Нанесите томатный соус, посыпьте тертым пекорино романо.'
      },
      {
        title: 'Моцарелла и пламя',
        desc: 'Выложите кусочки моцареллы ди буфала и отправьте в печь на 80-90 секунд.'
      },
      {
        title: 'Базилик и масло',
        desc: 'Свежий базилик и спираль оливкового масла завершают шедевр.'
      }
    ]
  },

  'diavola': {
    id: 'diavola',
    name: 'Везувий в Огне',
    alias: 'Spicy Nduja & Pepperoni',
    category: 'meat',
    price: '780 ₽',
    country: 'Калабрия, Италия',
    car: 'Юг Италии',
    image: 'images/pizza-diavola.jpg',
    tagline: '«Острая калабрийская ндуя и хрустящие чашечки пепперони»',
    story: 'В Реджо-ди-Калабрия на рынке мы познакомились с производителем острой паштетной колбасы Ндуя. Смешав её с копченой паприкой и чили-медом, мы получили пиццу с взрывным характером, которая бодрит лучше любого эспрессо.',
    cookTime: '90 секунд при 450°C',
    hydration: '68%',
    proTip: 'Сергей: «Мед, настоянный на острых перцах хабанеро, нейтрализует лишнюю жирность колбасы и превращает остроту в чистое гастрономическое наслаждение!»',
    ingredients: [
      { name: 'Тесто ферментированное', amount: '260 г' },
      { name: 'Томатная основа', amount: '80 г' },
      { name: 'Калабрийская острая Nduja', amount: '35 г' },
      { name: 'Артизанальная острая пепперони', amount: '60 г' },
      { name: 'Сыр моцарелла fior di latte', amount: '80 г' },
      { name: 'Острый чили-мед', amount: '1 ст. л.' }
    ],
    steps: [
      {
        title: 'Томатная база',
        desc: 'Нанесите соус San Marzano и рассыпьте моцареллу.'
      },
      {
        title: 'Огненная начинка',
        desc: 'Разложите кусочки пастообразной ндуи и тонкие ломтики пепперони.'
      },
      {
        title: 'Выпечка в печи',
        desc: 'Пепперони сворачивается в хрустящие чашечки, удерживающие ароматное масло со специями.'
      },
      {
        title: 'Медовая глазурь',
        desc: 'При подаче полейте горячую пиццу острым чили-медом.'
      }
    ]
  },

  'four-cheeses': {
    id: 'four-cheeses',
    name: 'Шесть Сыров Дороги',
    alias: 'Grand Tour Fromage',
    category: 'cheese',
    price: '850 ₽',
    country: 'Альпийские перевалы',
    car: 'Mercedes W124 Estate',
    image: 'images/pizza-four-cheeses.jpg',
    tagline: '«Сливочное изобилие горных сыроварен»',
    story: 'Путешествуя по Швейцарии и северной Италии, мы набивали багажник универсала головами сыров: от тягучего таледжо до пикантной горгонзолы. Эта пицца — наша дань уважения альпийским пастбищам.',
    cookTime: '100 секунд при 440°C',
    hydration: '67%',
    proTip: 'Дима: «Слайсы сочной спелой груши создают идеальный баланс с терпкой синей плесенью горгонзолы!»',
    ingredients: [
      { name: 'Тесто Biga', amount: '260 г' },
      { name: 'Fior di latte', amount: '50 г' },
      { name: 'Gorgonzola Piccante', amount: '40 г' },
      { name: 'Taleggio D.O.P.', amount: '40 г' },
      { name: 'Копченая скаморца', amount: '30 г' },
      { name: 'Parmigiano Reggiano 24 мес.', amount: '20 г' },
      { name: 'Тонкие ломтики спелой груши', amount: '40 г' },
      { name: 'Дробленая обжаренная фисташка', amount: '15 г' }
    ],
    steps: [
      {
        title: 'Сырная симфония',
        desc: 'На белую основу равномерно выкладываются моцарелла, кусочки таледжо, скаморцы и горгонзолы.'
      },
      {
        title: 'Фруктовая нота',
        desc: 'Между сырами в шахматном порядке вкладываются тончайшие ломтики груши сорта Конференц.'
      },
      {
        title: 'Выпекание',
        desc: 'Сыры сливаются в бархатистую бурлящую реку с золотистыми островками.'
      },
      {
        title: 'Пармезан и орехи',
        desc: 'Перед подачей посыпается облаком тертого пармезана и изумрудной фисташкой.'
      }
    ]
  }
};

// ===================================================================
// 3. Expeditions / Cars Data
// ===================================================================
const CARS_DATA = {
  'volvo': {
    title: 'Volvo 240 GL Wagon (1984)',
    alias: '«Красный Кирпич»',
    country: 'Италия — Тоскана & Неаполь',
    odometer: '482 000 км',
    fuel: '2.3L Redblock бензин + карбюратор',
    trunk: ['Мешок муки Caputo 50 кг', 'Набор ключей на 10 и 13', 'Колодезный трос', 'Ящик томатов Сан-Марцано'],
    story: 'Наш верный танк. Куплен за 400 долларов в складчину. На нем мы проехали всю Тоскану. Когда под Сан-Джиминьяно лопнул шланг радиатора, мы заклеили его термолентой и познакомились с синьорой Розой, научившей нас секретам закваски. В багажник универсала влезает полноценная мобильная мини-печь!',
    pizzaLink: 'Тосканский Кирпич',
    pizzaId: 'tuscan'
  },
  'vw-bus': {
    title: 'Volkswagen T2 Westfalia (1978)',
    alias: '«Лимончелло»',
    country: 'Греция — Пелопоннес & Побережье',
    odometer: '340 000 км',
    fuel: '1.6L оппозитный "воздушник"',
    trunk: ['Газовая горелка Primus', 'Бидон оливкового масла 10л', 'Складные шезлонги', 'Акустическая гитара Семёна'],
    story: 'Ярко-желтый дом на колесах. Медленный, шумный, но бесконечно любимый. В нем мы спали под шум прибоя на диких пляжах Греции. Его крыша поднимается вверх, превращая салон в уютную кухню-мастерскую, где Дима экспериментировал с маринадами и диким орегано.',
    pizzaLink: 'Одиссея Т2',
    pizzaId: 'greece'
  },
  'mercedes': {
    title: 'Mercedes-Benz W124 Estate (1991)',
    alias: '«Седой Барон»',
    country: 'Кавказ — Грузия & Горные перевалы',
    odometer: '615 000 км',
    fuel: '3.0L рядная дизельная "шестерка" ОМ603',
    trunk: ['Буковые дрова для печи', 'Чугунные сковороды', 'Сулугуни в рассоле', 'Цепи противоскольжения'],
    story: 'Неубиваемый универсал на гидравлической задней подвеске. Проглатывал любые горные гравийки и ямы. Когда на Крестовом перевале началась пурга, дизель мягко урчал всю ночь, обогревая нас, пока мы пекли лепешки с сулугуни прямо на походной чугунной плите.',
    pizzaLink: 'Кавказский Дрифт',
    pizzaId: 'caucasus'
  },
  'niva': {
    title: 'ВАЗ-2121 «Нива» 4х4 (1988)',
    alias: '«Таёжная Стрела»',
    country: 'Алтай & Сибирские дебри',
    odometer: '198 000 км',
    fuel: '1.6L постоянный полный привод + понижайка',
    trunk: ['Ручная лебедка и шаклы', 'Корзины под лисички и белые', 'Топор кованый', 'Мешочек кедровых орехов'],
    story: 'Настоящий проходимец. Пробиралась сквозь таежные броды и валежник туда, куда ни одна иномарка в жизни бы не доехала. Именно на ней мы добрались до диких грибных полян у реки Катунь и придумали нашу самую сытную сибирскую пиццу.',
    pizzaLink: 'Таёжный Заповедник',
    pizzaId: 'taiga'
  },
  'citroen': {
    title: 'Citroën DS 21 Pallas (1972)',
    alias: '«Французская Акула»',
    country: 'Франция — Прованс & Лазурный Берег',
    odometer: '275 000 км',
    fuel: '2.1L гидропневматика',
    trunk: ['Банки с инжирным конфитюром', 'Козий сыр Шевр', 'Лавандовый мед', 'Энциклопедия трав Прованса'],
    story: 'Сгусток космического ретрофутуризма. Плывет над дорогой как ковер-самолет. Когда гидравлическая жидкость LHM закапала на лавандовом поле, мы провели три незабываемых дня в гостях у французского пасечника, постигая тайны сочетания козьих сыров и меда.',
    pizzaLink: 'Прованский Бриз',
    pizzaId: 'provence'
  }
};

// ===================================================================
// 4. Dough Calculator Logic
// ===================================================================
function updateDoughCalculator(count) {
  const flourBase = 155; // grams per pizza
  const waterBase = 105; // ml per pizza
  const saltBase = 4.3;  // grams
  const yeastBase = 1.2; // dry yeast (or 35g fresh biga)
  const oilBase = 5;     // ml olive oil

  const totalFlour = Math.round(flourBase * count);
  const totalWater = Math.round(waterBase * count);
  const totalSalt = (saltBase * count).toFixed(1);
  const totalYeast = (yeastBase * count).toFixed(1);
  const totalOil = Math.round(oilBase * count);
  const totalDough = Math.round((flourBase + waterBase + saltBase + yeastBase + oilBase) * count);

  document.getElementById('calc-count-val').innerText = count;
  document.getElementById('res-flour').innerText = `${totalFlour} г`;
  document.getElementById('res-water').innerText = `${totalWater} мл`;
  document.getElementById('res-yeast').innerText = `${totalYeast} г (или ${Math.round(35 * count)} г Biga)`;
  document.getElementById('res-salt').innerText = `${totalSalt} г`;
  document.getElementById('res-oil').innerText = `${totalOil} мл`;
  document.getElementById('res-total').innerText = `${totalDough} г (${count} шариков по ~260 г)`;
}

// ===================================================================
// 5. Hero Particle Spark / Ember Animation
// ===================================================================
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const sparks = [];
  const maxSparks = 65;

  class Spark {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 50;
      this.size = Math.random() * 2.8 + 1;
      this.speedY = Math.random() * 1.5 + 0.6;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.opacity = Math.random() * 0.7 + 0.3;
      this.decay = Math.random() * 0.003 + 0.002;
      this.hue = Math.random() > 0.4 ? 28 : 42; // Orange or golden
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      this.opacity -= this.decay;
      if (this.y < -20 || this.opacity <= 0) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 95%, 60%, ${this.opacity})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 0.8)`;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < maxSparks; i++) {
    const s = new Spark();
    s.y = Math.random() * height;
    sparks.push(s);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let s of sparks) {
      s.update();
      s.draw();
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// ===================================================================
// 6. Recipe Modal Display
// ===================================================================
function openRecipeModal(pizzaId) {
  const p = PIZZA_DATA[pizzaId];
  if (!p) return;

  const modal = document.getElementById('recipe-modal');
  document.getElementById('modal-img').src = p.image;
  document.getElementById('modal-img').alt = p.name;
  document.getElementById('modal-title').innerText = p.name;
  document.getElementById('modal-short').innerText = `${p.tagline} • ${p.country}`;
  document.getElementById('modal-story').innerText = p.story;
  document.getElementById('modal-time').innerText = p.cookTime;
  document.getElementById('modal-hydration').innerText = p.hydration;
  document.getElementById('modal-car').innerText = p.car;
  document.getElementById('modal-protip').innerText = p.proTip;

  // Ingredients list
  const ingList = document.getElementById('modal-ingredients-list');
  ingList.innerHTML = p.ingredients.map(ing => `
    <li>
      <span>${ing.name}</span>
      <strong>${ing.amount}</strong>
    </li>
  `).join('');

  // Steps
  const stepList = document.getElementById('modal-steps-list');
  stepList.innerHTML = p.steps.map((st, idx) => `
    <div class="step-card">
      <div class="step-num">${idx + 1}</div>
      <div class="step-text">
        <h5>${st.title}</h5>
        <p>${st.desc}</p>
      </div>
    </div>
  `).join('');

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeRecipeModal() {
  const modal = document.getElementById('recipe-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ===================================================================
// 7. Guestbook / Memory Wall Logic (Distinct Guest Photos)
// ===================================================================
const INITIAL_REVIEWS = [
  {
    author: 'Михаил & Алёна',
    city: 'Санкт-Петербург / Volvo 740',
    text: '«Заехали случайно, увидев старый желтый бусик T2 у входа. Съели "Одиссею" и "Тосканский кирпич" — тесто просто космическое, невесомое, хрустит и тает. Ребята, это лучшая пицца восточнее Неаполя!»',
    avatar: 'images/guest-1.jpg'
  },
  {
    author: 'Марко Беллини',
    city: 'Болонья, Италия / Путешественник',
    text: '«Я скептически отношусь к пицце за пределами Италии, но когда Сергей рассказал про 72-часовую ферментацию биги и дал попробовать "Маргариту" — у меня на глазах навернулись слезы ностальгии. Bravissimi fratelli!»',
    avatar: 'images/guest-2.jpg'
  },
  {
    author: 'Елена и Костя',
    city: 'Москва / Автопутешественники',
    text: '«"Таёжный заповедник" с лисичками и кедровыми орешками — это гастрономический оргазм. Слушали байки Семёна про Крестовый перевал под потрескивание дров до полуночи. Вернемся обязательно!»',
    avatar: 'images/guest-3.jpg'
  }
];

function loadGuestbook() {
  const container = document.getElementById('guestbook-cards-container');
  if (!container) return;

  let reviews = [];
  try {
    const saved = localStorage.getItem('pidrizza_reviews_v2');
    reviews = saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  } catch (e) {
    reviews = INITIAL_REVIEWS;
  }

  // Ensure reviews never use founders' photos
  reviews = reviews.map((r, i) => {
    let av = r.avatar;
    if (!av || av.includes('sergey') || av.includes('dima') || av.includes('semyon') || av.includes('friends-trio')) {
      const gIndex = (i % 3) + 1;
      av = `images/guest-${gIndex}.jpg`;
    }
    return { ...r, avatar: av };
  });

  container.innerHTML = reviews.map((r, i) => `
    <div class="guestbook-card" style="transform: rotate(${(i % 2 === 0 ? -1.2 : 1.4) * (1 + (i % 3) * 0.2)}deg)">
      <div class="guestbook-card-tape"></div>
      <p class="guest-quote">${r.text}</p>
      <div class="guest-author-row">
        <img class="guest-avatar" src="${r.avatar}" alt="${r.author}">
        <div>
          <div class="guest-name">${r.author}</div>
          <div class="guest-city">${r.city}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function handleAddReview(e) {
  e.preventDefault();
  const name = document.getElementById('review-author').value.trim();
  const city = document.getElementById('review-city').value.trim();
  const text = document.getElementById('review-text').value.trim();

  if (!name || !text) {
    alert('Пожалуйста, напишите ваше имя и пару теплых слов!');
    return;
  }

  let reviews = [];
  try {
    const saved = localStorage.getItem('pidrizza_reviews_v2');
    reviews = saved ? JSON.parse(saved) : [...INITIAL_REVIEWS];
  } catch (err) {
    reviews = [...INITIAL_REVIEWS];
  }

  const avatarChoice = (reviews.length % 3) + 1;

  reviews.unshift({
    author: name,
    city: city || 'Путешественник',
    text: `«${text}»`,
    avatar: `images/guest-${avatarChoice}.jpg`
  });

  try {
    localStorage.setItem('pidrizza_reviews_v2', JSON.stringify(reviews));
  } catch (err) {}

  loadGuestbook();
  document.getElementById('review-form').reset();
  alert('Спасибо за душевный отзыв! Ваша записка прикреплена к нашей стене историй.');
}

// ===================================================================
// 8. Interactive Route Map Pins
// ===================================================================
const MAP_STOPS = {
  'tuscany': {
    title: 'Сан-Джиминьяно, Италия',
    car: 'Volvo 240 Wagon (1984)',
    desc: 'Остановка из-за лопнувшего шланга радиатора. Встреча с синьорой Розой и ее 60-летней закваской. Рождение «Тосканского Кирпича».',
    pizzaId: 'tuscan'
  },
  'greece': {
    title: 'Коринфский залив, Греция',
    car: 'VW T2 Camper (1978)',
    desc: 'Обмен запасного ремня генератора на бочонок оливкового масла Каламата и свежую овечью фету на берегу Ионического моря.',
    pizzaId: 'greece'
  },
  'caucasus': {
    title: 'Крестовый перевал, Грузия',
    car: 'Mercedes W124 Estate (1991)',
    desc: 'Ночевка в снежном плену на высоте 2379 метров. Чугунная сковорода, костер из бука и расплавленный копченый сулугуни.',
    pizzaId: 'caucasus'
  },
  'taiga': {
    title: 'Алтайские дебри, река Катунь',
    car: 'ВАЗ-2121 «Нива» (1988)',
    desc: 'Штурм торфяных бродов на лебедке. Сбор диких лисичек, боровиков и кедровых шишек под северными звездами.',
    pizzaId: 'taiga'
  },
  'provence': {
    title: 'Плато Валансоль, Франция',
    car: 'Citroën DS 21 (1972)',
    desc: 'Отказ гидроподвески посреди цветущего лавандового поля. Пасечник Жан-Поль, сыр Шевр и свежий лавандовый мед.',
    pizzaId: 'provence'
  }
};

function selectMapStop(stopKey) {
  const s = MAP_STOPS[stopKey];
  if (!s) return;

  const popup = document.getElementById('map-popup');
  document.getElementById('map-popup-tag').innerText = s.car;
  document.getElementById('map-popup-title').innerText = s.title;
  document.getElementById('map-popup-desc').innerText = s.desc;
  document.getElementById('map-popup-btn').setAttribute('onclick', `openRecipeModal('${s.pizzaId}')`);

  document.querySelectorAll('.map-pin-circle').forEach(c => {
    c.setAttribute('r', '7');
    c.setAttribute('fill', '#f59e36');
  });
  const activePin = document.getElementById(`pin-${stopKey}`);
  if (activePin) {
    activePin.setAttribute('r', '11');
    activePin.setAttribute('fill', '#e26736');
  }
}

// ===================================================================
// 9. Initialization & Event Listeners
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Audio toggle
  const audioBtn = document.getElementById('audio-toggle-btn');
  const atmosphereBar = document.getElementById('atmosphere-bar');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const playing = fireplace.toggle();
      if (playing) {
        atmosphereBar.classList.add('audio-playing');
        document.getElementById('audio-status-text').innerText = 'Огонь горит (выкл)';
      } else {
        atmosphereBar.classList.remove('audio-playing');
        document.getElementById('audio-status-text').innerText = 'Звук печи (вкл)';
      }
    });
  }

  // 2. Header scroll styling
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 3. Mobile menu drawer
  const navToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // 4. Hero canvas sparks
  initHeroCanvas();

  // 5. Car Tabs switcher
  const carTabs = document.querySelectorAll('.car-nav-tab');
  carTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const carKey = tab.dataset.car;
      carTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.car-display-card').forEach(card => {
        card.classList.remove('active');
      });
      const targetCard = document.getElementById(`car-card-${carKey}`);
      if (targetCard) targetCard.classList.add('active');
    });
  });

  // 6. Menu Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  const pizzaCards = document.querySelectorAll('.pizza-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category;

      pizzaCards.forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 7. Dough Calculator controls
  let pizzaCount = 4;
  updateDoughCalculator(pizzaCount);

  const btnMinus = document.getElementById('calc-minus');
  const btnPlus = document.getElementById('calc-plus');
  if (btnMinus && btnPlus) {
    btnMinus.addEventListener('click', () => {
      if (pizzaCount > 1) {
        pizzaCount--;
        updateDoughCalculator(pizzaCount);
      }
    });
    btnPlus.addEventListener('click', () => {
      if (pizzaCount < 16) {
        pizzaCount++;
        updateDoughCalculator(pizzaCount);
      }
    });
  }

  // 8. Guestbook review submission
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleAddReview);
  }
  loadGuestbook();

  // 9. Close recipe modal on backdrop click or ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeRecipeModal();
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach(mb => {
    mb.addEventListener('click', (e) => {
      if (e.target === mb) {
        closeRecipeModal();
      }
    });
  });
});
