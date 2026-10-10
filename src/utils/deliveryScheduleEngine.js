/**
 * ABSOLUTE DENTAL — UNIFIED DELIVERY SCHEDULE & APPOINTMENT ENGINE
 * Authoritative single source of truth for:
 * 1. Delivery Days selection (Today, Tomorrow, Upcoming week days, Any day, Custom date)
 * 2. Delivery Time Slots selection (8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, Any time)
 * 3. Schedule tags serialization & regex extraction from order notes
 * 4. WhatsApp notification message generation
 */

export const DELIVERY_TIME_SLOTS = [
  { id: '8:00', value: '8:00 صباحاً', labelAr: '8:00 صباحاً', labelEn: '8:00 AM', periodAr: 'الصباح الباكر', periodEn: 'Early Morning', icon: '🌅' },
  { id: '10:00', value: '10:00 صباحاً', labelAr: '10:00 صباحاً', labelEn: '10:00 AM', periodAr: 'الفترة الصباحية', periodEn: 'Mid-Morning', icon: '☀️' },
  { id: '12:00', value: '12:00 ظهراً', labelAr: '12:00 ظهراً', labelEn: '12:00 PM', periodAr: 'فترة الظهيرة', periodEn: 'Noon', icon: '🕛' },
  { id: '2:00', value: '2:00 ظهراً', labelAr: '2:00 ظهراً', labelEn: '2:00 PM', periodAr: 'بعد الظهر', periodEn: 'Afternoon', icon: '🌤️' },
  { id: 'anytime', value: 'أي وقت يناسبكم', labelAr: 'أي وقت يناسبكم', labelEn: 'Any time suits you', periodAr: 'متاح طوال اليوم', periodEn: 'Flexible all day', icon: '🤝' },
];

/**
 * Returns dynamic list of selectable delivery days starting from today.
 */
export const getUpcomingDeliveryDays = () => {
  const days = [];
  const now = new Date();

  const arabicWeekdays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const englishWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const englishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 1. "أي يوم يناسبكم"
  days.push({
    id: 'anyday',
    value: 'أي يوم يناسبكم',
    labelAr: 'أي يوم يناسبكم',
    labelEn: 'Any day suits you',
    subAr: 'بأقرب موعد متاح',
    subEn: 'Earliest available',
    icon: '🤝',
    isSpecial: true
  });

  // Next 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const dayOfWeek = d.getDay();
    const dayOfMonth = d.getDate();
    const month = d.getMonth();

    const weekdayAr = arabicWeekdays[dayOfWeek];
    const weekdayEn = englishWeekdays[dayOfWeek];
    const monthAr = arabicMonths[month];
    const monthEn = englishMonths[month];

    let prefixAr = '';
    let prefixEn = '';
    if (i === 0) {
      prefixAr = 'اليوم';
      prefixEn = 'Today';
    } else if (i === 1) {
      prefixAr = 'غداً';
      prefixEn = 'Tomorrow';
    } else if (i === 2) {
      prefixAr = 'بعد غد';
      prefixEn = 'In 2 days';
    }

    const dateFormattedAr = `${dayOfMonth} ${monthAr}`;
    const dateFormattedEn = `${monthEn} ${dayOfMonth}`;

    const fullLabelAr = prefixAr ? `${prefixAr} (${weekdayAr} ${dateFormattedAr})` : `${weekdayAr} (${dateFormattedAr})`;
    const fullLabelEn = prefixEn ? `${prefixEn} (${weekdayEn}, ${dateFormattedEn})` : `${weekdayEn} (${dateFormattedEn})`;

    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    days.push({
      id: `day-${i}`,
      isoDate,
      value: fullLabelAr,
      labelAr: prefixAr || weekdayAr,
      labelEn: prefixEn || weekdayEn,
      subAr: prefixAr ? `${weekdayAr} ${dateFormattedAr}` : dateFormattedAr,
      subEn: prefixEn ? `${weekdayEn}, ${dateFormattedEn}` : dateFormattedEn,
      fullLabelAr,
      fullLabelEn,
      icon: i === 0 ? '⚡' : i === 1 ? '📅' : '🗓️'
    });
  }

  return days;
};

/**
 * Formats custom date (YYYY-MM-DD) into readable Arabic and English delivery day strings.
 */
export const formatCustomDateToDeliveryDay = (isoDateString) => {
  if (!isoDateString) return '';
  const parts = isoDateString.split('-');
  if (parts.length !== 3) return isoDateString;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return isoDateString;

  const arabicWeekdays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const weekday = arabicWeekdays[d.getDay()];
  const day = d.getDate();
  const month = arabicMonths[d.getMonth()];
  return `${weekday} (${day} ${month})`;
};

export const formatSelectedSlots = (slots, lang = 'ar') => {
  if (!Array.isArray(slots) || slots.length === 0) return lang === 'ar' ? '10:00 صباحاً' : '10:00 AM';
  if (slots.includes('أي وقت يناسبكم')) return lang === 'ar' ? 'أي وقت يناسبكم' : 'Any time suits you';
  const sep = lang === 'ar' ? ' أو ' : ' or ';
  return slots.join(sep);
};

export const parseDeliveryTimeSlots = (rawString) => {
  if (!rawString) return ['10:00 صباحاً'];
  const s = String(rawString).trim();
  if (s.includes('أي وقت') || s.includes('اي وقت') || s.includes('Any time')) {
    return ['أي وقت يناسبكم'];
  }
  const found = [];
  if (s.includes('08:00') || s.includes('8:00')) found.push('8:00 صباحاً');
  if (s.includes('10:00')) found.push('10:00 صباحاً');
  if (s.includes('12:00')) found.push('12:00 ظهراً');
  if (s.includes('02:00') || s.includes('2:00')) found.push('2:00 ظهراً');
  return found.length > 0 ? found : [s];
};

export const toggleTimeSlotSelection = (currentSlots, slotValue) => {
  if (slotValue === 'أي وقت يناسبكم') {
    return ['أي وقت يناسبكم'];
  }
  const base = (currentSlots || []).filter(s => s !== 'أي وقت يناسبكم');
  if (base.includes(slotValue)) {
    if (base.length <= 1) return base;
    return base.filter(s => s !== slotValue);
  } else {
    const chronological = ['8:00 صباحاً', '10:00 صباحاً', '12:00 ظهراً', '2:00 ظهراً'];
    const updated = [...base, slotValue];
    updated.sort((a, b) => chronological.indexOf(a) - chronological.indexOf(b));
    return updated;
  }
};

/**
 * Extracts delivery schedule (both Day and Time) from an order object.
 */
export const extractOrderDeliverySchedule = (order) => {
  if (!order) {
    return {
      day: 'غداً',
      time: '10:00 صباحاً',
      timeSlots: ['10:00 صباحاً'],
      display: 'غداً — 10:00 صباحاً',
      hasDay: false,
      hasTime: false
    };
  }
  const combined = `${order.delivery_notes || ''} ${order.notes || ''}`;

  // 1. Extract Day
  let day = '';
  let hasDay = false;
  const dayMatch = combined.match(/\[يوم الاستلام:\s*([^\]]+)\]/) || combined.match(/\[يوم التسليم المفضل:\s*([^\]]+)\]/);
  if (dayMatch && dayMatch[1]) {
    day = dayMatch[1].trim();
    hasDay = true;
  } else if (combined.includes('أي يوم') || combined.includes('اي يوم')) {
    day = 'أي يوم يناسبكم';
    hasDay = true;
  } else {
    day = 'غداً';
  }

  // 2. Extract Time
  let time = '10:00 صباحاً';
  let hasTime = false;
  const timeMatch = combined.match(/\[توقيت التسليم المفضل:\s*([^\]]+)\]/) || combined.match(/\[وقت التسليم:\s*([^\]]+)\]/);
  if (timeMatch && timeMatch[1]) {
    time = timeMatch[1].trim();
    hasTime = true;
  } else if (combined.includes('أي وقت') || combined.includes('اي وقت')) {
    time = 'أي وقت يناسبكم';
    hasTime = true;
  } else {
    const detected = [];
    if (combined.includes('08:00') || combined.includes('8:00')) detected.push('8:00 صباحاً');
    if (combined.includes('10:00')) detected.push('10:00 صباحاً');
    if (combined.includes('12:00')) detected.push('12:00 ظهراً');
    if (combined.includes('02:00') || combined.includes('2:00')) detected.push('2:00 ظهراً');
    if (detected.length > 0) {
      time = detected.join(' أو ');
      hasTime = true;
    }
  }

  const timeSlots = parseDeliveryTimeSlots(time);
  const display = hasDay ? `${day} — ${time}` : time;

  return {
    day,
    time,
    timeSlots,
    display,
    hasDay,
    hasTime
  };
};

/**
 * Builds standard notes and delivery_notes with both day and time tags.
 */
export const buildDeliveryScheduleNotes = ({ day, timeSlots, existingNotes = '' }) => {
  const formattedTime = formatSelectedSlots(timeSlots, 'ar');
  const dayTag = `[يوم الاستلام: ${day || 'غداً'}]`;
  const timeTag = `[توقيت التسليم المفضل: ${formattedTime}]`;
  const scheduleHeader = `${dayTag} ${timeTag}`;

  let cleanNotes = String(existingNotes || '')
    .replace(/\[يوم الاستلام:[^\]]+\]\s*/g, '')
    .replace(/\[يوم التسليم المفضل:[^\]]+\]\s*/g, '')
    .replace(/\[توقيت التسليم المفضل:[^\]]+\]\s*/g, '')
    .replace(/\[وقت التسليم:[^\]]+\]\s*/g, '')
    .trim();

  const combinedNotes = cleanNotes ? `${scheduleHeader}\n${cleanNotes}` : scheduleHeader;
  const deliveryNotes = scheduleHeader;

  return {
    combinedNotes,
    deliveryNotes,
    formattedTime,
    formattedDay: day || 'غداً',
    scheduleHeader
  };
};
