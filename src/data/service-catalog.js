export const serviceCatalog = [
  {
    id: 'maintenance',
    title: 'ТО и диагностика',
    services: [
      { slug: 'tehnicheskoe-obsluzhivanie', title: 'Плановое ТО', description: 'Замена масла и фильтров, проверки по пробегу.' },
      { slug: 'diagnostika-avtomobilya', title: 'Диагностика автомобиля', description: 'Поиск причины стука, вибрации или ошибки на панели.' },
      {
        slug: 'shinomontazh', title: 'Шиномонтаж и балансировка', description: 'Сезонная замена шин и ремонт проколов.',
        quote: { group: 'Шиномонтаж (комплекс 4 колеса балансировка) - Легковые автомобили:', label: 'Комплекс на 4 колеса для легковых' },
      },
    ],
  },
  {
    id: 'repair',
    title: 'Ремонт автомобиля',
    navTitle: 'Ремонт',
    services: [
      { slug: 'remont-podveski', description: 'Амортизаторы, рычаги, сайлентблоки и ступицы.', quote: { row: 'Диагностика подвески' } },
      { slug: 'remont-tormozov', description: 'Колодки, диски, суппорты и тормозная жидкость.', quote: { row: 'Диагностика тормозной системы', label: 'Проверка тормозной системы' } },
      { slug: 'remont-dvigatelya', description: 'Ремень и цепь ГРМ, течи масла, замер компрессии.', quote: { row: 'Осмотр двигателя' } },
      { slug: 'avtoelektrika', description: 'Аккумулятор, стартер, генератор и проводка.', quote: { row: 'Осмотр наружного освещения', label: 'Проверка наружного освещения' } },
      { slug: 'rulevoe-upravlenie', description: 'Рулевая рейка, тяги, наконечники и гидроусилитель.', quote: { row: 'Наконечник рулевой - замена', label: 'Замена рулевого наконечника' } },
      { slug: 'remont-transmissii', description: 'Коробка передач, сцепление и приводы.', quote: { row: 'Осмотр трансмисии', label: 'Осмотр трансмиссии' } },
      { slug: 'otoplenie-i-ohlazhdenie', title: 'Отопление и охлаждение', description: 'Печка, радиаторы, термостат, помпа и утечки антифриза.', quote: { row: 'Осмотр системы охлаждения' } },
      { slug: 'vyhlopnaya-sistema', title: 'Выхлопная система', description: 'Глушитель, резонатор, гофра и крепления выхлопа.', quote: { row: 'Хомут глушителя - замена', label: 'Замена хомута глушителя' } },
      { slug: 'toplivnaya-sistema', title: 'Топливная система', description: 'Проверка подачи топлива, датчики и промывка бака.', quote: { row: 'Осмотр топливной системы' } },
    ],
  },
  {
    id: 'body-interior',
    title: 'Кузов и салон',
    services: [
      { slug: 'svarochnye-raboty', title: 'Кузовная сварка', description: 'Пороги, днище, арки и сквозная коррозия.', quote: { row: 'Мелкие сварочные работы' } },
      { slug: 'antikor', title: 'Антикор днища', description: 'Защита днища от коррозии после осмотра металла.' },
      { slug: 'peretyazhka-salona', description: 'Сиденья, руль, потолок и дверные вставки.', quote: { row: 'Перетяжка руля' } },
      { slug: 'shumoizolyatsiya', description: 'Обработка дверей и других зон, откуда идёт шум.', quote: { label: 'Шумоизоляция четырёх дверей' } },
      { slug: 'avtozvuk', description: 'Установка магнитол, динамиков и усилителей.' },
      { slug: 'himchistka-salona', description: 'Чистка обивки и поверхностей салона.' },
    ],
  },
];
