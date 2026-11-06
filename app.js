/**
 * Quran Booking SPA - Modern Cal.com & Linear Inspired Experience
 * Pure Zero-Server Architecture for Cloudflare Pages
 */

// --- 114 Quran Surahs in Arabic ---
const QURAN_SURAHS = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس", "مراجعة جزء كامل أو أحزاب متعددة"
];

// --- Arabic Days and Months ---
const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// --- Default Configuration ---
const DEFAULT_SETTINGS = {
  teacherName: "فضيلة الشيخ د. عبد الرحمن بن محمد",
  teacherTitle: "مقرئ بالقراءات العشر ومجاز في القرآن الكريم",
  teacherAvatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
  sessionTitle: "جلسة تسميع وإتقان القرآن الكريم",
  sessionDescription: "جلسة قرآنية فردية (عن بُعد) مخصصة لتسميع الحفظ الجديد، مراجعة وتثبيت المحفوظ، أو تصحيح التلاوة وأحكام التجويد بمتابعة دقيقة.",
  sessionDuration: 20, // minutes
  meetingPlatform: "Google Meet",
  meetingUrl: "https://meet.google.com/new",
  webhookUrl: "", // Google Apps Script Webhook
  workingDays: [0, 1, 2, 3, 4], // Sun, Mon, Tue, Wed, Thu
  workHoursStart: "16:00", // 4:00 PM
  workHoursEnd: "21:00", // 9:00 PM
  breakHoursStart: "18:00", // 6:00 PM
  breakHoursEnd: "18:30", // 6:30 PM (Maghrib prayer break)
  slotBuffer: 0 // minutes between slots
};

// --- Application State ---
let state = {
  settings: { ...DEFAULT_SETTINGS },
  currentCalendarDate: new Date(), // for browsing months
  selectedDate: null, // selected day YYYY-MM-DD
  selectedSlot: null, // selected time slot object
  currentStep: 1, // 1: Calendar & Slots, 2: Form, 3: Confirmed
  lastBooking: null,
  isSubmitting: false,
  theme: 'dark'
};

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initTheme();
  populateSurahs();
  renderTeacherInfo();
  renderCalendar();
  bindEvents();
});

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem('quran_booking_theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('quran_booking_theme', theme);
  const html = document.documentElement;
  const themeIcon = document.getElementById('theme-icon');
  
  if (theme === 'dark') {
    html.classList.add('dark');
    document.body.classList.remove('bg-slate-50', 'bg-grid-pattern-light');
    document.body.classList.add('bg-[#09090b]', 'bg-grid-pattern-dark', 'text-slate-100');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
  } else {
    html.classList.remove('dark');
    document.body.classList.remove('bg-[#09090b]', 'bg-grid-pattern-dark', 'text-slate-100');
    document.body.classList.add('bg-slate-50', 'bg-grid-pattern-light', 'text-slate-900');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
  }
  if (window.lucide) window.lucide.createIcons();
}

function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
}

// --- Settings Persistence ---
function loadSettings() {
  try {
    const raw = localStorage.getItem('quran_booking_settings');
    if (raw) {
      state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
    state.settings = { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(newSettings) {
  state.settings = { ...state.settings, ...newSettings };
  localStorage.setItem('quran_booking_settings', JSON.stringify(state.settings));
  renderTeacherInfo();
  renderCalendar();
  showToast("تم حفظ الإعدادات بنجاح!", "success");
}

function resetSettings() {
  if (confirm("هل أنت متأكد من استعادة الإعدادات الافتراضية؟")) {
    state.settings = { ...DEFAULT_SETTINGS };
    localStorage.removeItem('quran_booking_settings');
    populateSettingsForm();
    renderTeacherInfo();
    renderCalendar();
    showToast("تمت استعادة الإعدادات الافتراضية", "info");
  }
}

// --- Render Sheikh Profile / Header Information ---
function renderTeacherInfo() {
  const { teacherName, teacherTitle, sessionTitle, sessionDescription, sessionDuration, meetingPlatform } = state.settings;
  
  setText('profile-name', teacherName);
  setText('profile-title', teacherTitle);
  setText('session-title', sessionTitle);
  setText('session-desc', sessionDescription);
  setText('session-duration', `${sessionDuration} دقيقة`);
  setText('session-platform', meetingPlatform);
  
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl && state.settings.teacherAvatar) {
    avatarEl.src = state.settings.teacherAvatar;
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// --- Populate Surahs Dropdown ---
function populateSurahs() {
  const select = document.getElementById('form-surah');
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>اختر السورة أو الجزء المراد تسميعه...</option>';
  QURAN_SURAHS.forEach((surah, idx) => {
    const opt = document.createElement('option');
    opt.value = surah;
    opt.textContent = `${idx + 1 <= 114 ? (idx + 1) + '. ' : ''}سورة ${surah}`;
    select.appendChild(opt);
  });
}

// --- Calendar Logic ---
function renderCalendar() {
  const calGrid = document.getElementById('calendar-grid');
  const calMonthTitle = document.getElementById('calendar-month-title');
  if (!calGrid || !calMonthTitle) return;

  const year = state.currentCalendarDate.getFullYear();
  const month = state.currentCalendarDate.getMonth();

  // Arabic Month Title (e.g. نوفمبر 2026)
  calMonthTitle.textContent = `${AR_MONTHS[month]} ${year}`;

  calGrid.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Blank days before month starts
  for (let i = 0; i < firstDayIndex; i++) {
    const blank = document.createElement('div');
    blank.className = 'h-10 w-10 sm:h-11 sm:w-11';
    calGrid.appendChild(blank);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);
    const dateStr = formatDateISO(dateObj);
    const dayOfWeek = dateObj.getDay();

    const isPast = dateObj < today;
    const isWorkingDay = state.settings.workingDays.includes(dayOfWeek);
    const isAvailable = !isPast && isWorkingDay;
    const isSelected = state.selectedDate === dateStr;
    const isToday = dateObj.getTime() === today.getTime();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = day;

    let baseClasses = 'relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ';

    if (isSelected) {
      baseClasses += 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-emerald-900/40 scale-105';
    } else if (isAvailable) {
      baseClasses += 'text-slate-200 dark:text-slate-100 bg-emerald-500/10 hover:bg-emerald-500/25 hover:text-emerald-300 dark:hover:text-emerald-200 border border-emerald-500/20 active:scale-95 cursor-pointer';
    } else {
      baseClasses += 'text-slate-400/40 dark:text-zinc-600 cursor-not-allowed bg-transparent';
      btn.disabled = true;
    }

    if (isToday && !isSelected) {
      baseClasses += ' border-b-2 border-b-emerald-400';
    }

    btn.className = baseClasses;

    if (isAvailable) {
      btn.addEventListener('click', () => {
        selectDate(dateStr, dateObj);
      });
    }

    calGrid.appendChild(btn);
  }

  // If no date is selected yet, or selected date is in another month, auto-select first available date
  if (!state.selectedDate) {
    const firstAvailable = findFirstAvailableDate(year, month, today);
    if (firstAvailable) {
      selectDate(formatDateISO(firstAvailable), firstAvailable);
    } else {
      renderSlots([]);
    }
  } else {
    // Re-render slots for selected date
    const [sY, sM, sD] = state.selectedDate.split('-').map(Number);
    selectDate(state.selectedDate, new Date(sY, sM - 1, sD));
  }
}

function findFirstAvailableDate(year, month, today) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    if (d >= today && state.settings.workingDays.includes(d.getDay())) {
      return d;
    }
  }
  return null;
}

function selectDate(dateStr, dateObj) {
  state.selectedDate = dateStr;
  
  // Update selected day visual in Calendar
  const calGrid = document.getElementById('calendar-grid');
  if (calGrid) {
    const buttons = calGrid.querySelectorAll('button:not(:disabled)');
    buttons.forEach(btn => {
      if (parseInt(btn.textContent, 10) === dateObj.getDate()) {
        btn.className = 'relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-sm font-bold bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-emerald-900/40 scale-105 transition-all flex items-center justify-center';
      } else {
        btn.className = 'relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-sm font-semibold text-slate-200 dark:text-slate-100 bg-emerald-500/10 hover:bg-emerald-500/25 hover:text-emerald-300 dark:hover:text-emerald-200 border border-emerald-500/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer';
      }
    });
  }

  // Format header for Slots Column (e.g. الأربعاء 12 نوفمبر)
  const slotDateTitle = document.getElementById('slots-date-title');
  if (slotDateTitle) {
    const dayName = AR_DAYS[dateObj.getDay()];
    const monthName = AR_MONTHS[dateObj.getMonth()];
    slotDateTitle.textContent = `${dayName}، ${dateObj.getDate()} ${monthName}`;
  }

  // Generate and render slots
  const slots = generateTimeSlots(dateObj);
  renderSlots(slots);
}

// --- Generate Time Slots ---
function generateTimeSlots(dateObj) {
  const { workHoursStart, workHoursEnd, breakHoursStart, breakHoursEnd, sessionDuration, slotBuffer } = state.settings;
  const slots = [];

  const [startH, startM] = workHoursStart.split(':').map(Number);
  const [endH, endM] = workHoursEnd.split(':').map(Number);
  const [breakStartH, breakStartM] = breakHoursStart.split(':').map(Number);
  const [breakEndH, breakEndM] = breakHoursEnd.split(':').map(Number);

  let currentMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  const breakStartMin = breakStartH * 60 + breakStartM;
  const breakEndMin = breakEndH * 60 + breakEndM;

  const now = new Date();
  const isToday = formatDateISO(dateObj) === formatDateISO(now);
  const currentNowMinutes = now.getHours() * 60 + now.getMinutes() + 15; // 15 min buffer for immediate bookings

  while (currentMin + sessionDuration <= endMin) {
    const slotEndMin = currentMin + sessionDuration;

    // Check if slot overlaps with break
    const overlapsBreak = (currentMin < breakEndMin && slotEndMin > breakStartMin);

    if (!overlapsBreak) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      const endH = Math.floor(slotEndMin / 60);
      const endM = slotEndMin % 60;

      const timeFormatted = formatTime12(h, m);
      const endTimeFormatted = formatTime12(endH, endM);

      const isPastSlot = isToday && (currentMin <= currentNowMinutes);

      slots.push({
        startHours: h,
        startMinutes: m,
        endHours: endH,
        endMinutes: endM,
        timeFormatted: timeFormatted,
        endTimeFormatted: endTimeFormatted,
        isoStartTime: `${state.selectedDate}T${padZero(h)}:${padZero(m)}:00`,
        isoEndTime: `${state.selectedDate}T${padZero(endH)}:${padZero(endM)}:00`,
        isAvailable: !isPastSlot
      });
    }

    currentMin += sessionDuration + (slotBuffer || 0);
  }

  return slots;
}

function renderSlots(slots) {
  const container = document.getElementById('slots-container');
  if (!container) return;

  container.innerHTML = '';

  if (!slots.length) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400">
        <i data-lucide="calendar-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
        <p class="text-sm">لا توجد أوقات متاحة لهذا اليوم</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  slots.forEach(slot => {
    if (!slot.isAvailable) return;

    const slotBtn = document.createElement('button');
    slotBtn.type = 'button';
    slotBtn.className = 'slot-btn w-full py-3 px-4 rounded-xl text-sm font-semibold border flex items-center justify-between transition-all group ' +
      'bg-slate-900/40 dark:bg-zinc-900/60 hover:bg-emerald-600 hover:text-white border-slate-700/60 dark:border-zinc-800 hover:border-emerald-500 shadow-sm';

    slotBtn.innerHTML = `
      <span class="font-bold tracking-wide text-slate-200 group-hover:text-white">${slot.timeFormatted}</span>
      <span class="text-xs text-slate-400 group-hover:text-emerald-100 flex items-center gap-1">
        <span>تأكيد الموعد</span>
        <i data-lucide="chevron-left" class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1"></i>
      </span>
    `;

    slotBtn.addEventListener('click', () => {
      chooseSlot(slot);
    });

    container.appendChild(slotBtn);
  });

  if (window.lucide) window.lucide.createIcons();
}

function chooseSlot(slot) {
  state.selectedSlot = slot;
  goToStep(2);
}

// --- Step Navigation ---
function goToStep(step) {
  state.currentStep = step;
  
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');

  if (step1) step1.classList.toggle('hidden', step !== 1);
  if (step2) step2.classList.toggle('hidden', step !== 2);
  if (step3) step3.classList.toggle('hidden', step !== 3);

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (step === 2) {
    setupStep2Form();
  }

  if (step === 3) {
    setupStep3Confirmation();
  }

  if (window.lucide) window.lucide.createIcons();
}

function setupStep2Form() {
  const [y, m, d] = state.selectedDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = AR_DAYS[dateObj.getDay()];
  const monthName = AR_MONTHS[dateObj.getMonth()];

  setText('summary-slot-date', `${dayName}، ${d} ${monthName} ${y}`);
  setText('summary-slot-time', `${state.selectedSlot.timeFormatted} (${state.settings.sessionDuration} دقيقة)`);
}

// --- Booking Form Submission ---
async function handleFormSubmit(e) {
  e.preventDefault();
  if (state.isSubmitting) return;

  const name = document.getElementById('form-name').value.trim();
  const email = document.getElementById('form-email').value.trim();
  const phone = document.getElementById('form-phone').value.trim();
  const sessionType = document.querySelector('input[name="session-type"]:checked')?.value || "حفظ جديد";
  const surah = document.getElementById('form-surah').value;
  const riwayah = document.getElementById('form-riwayah').value;
  const notes = document.getElementById('form-notes').value.trim();

  if (!name || !email || !phone || !surah) {
    showToast("يرجى ملء جميع الحقول المطلوبة", "error");
    return;
  }

  state.isSubmitting = true;
  const submitBtn = document.getElementById('btn-submit-booking');
  const originalBtnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="inline-flex items-center gap-2">
      <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      جاري تأكيد الموعد...
    </span>
  `;

  const bookingId = 'QRN-' + Date.now().toString().slice(-6);

  const bookingPayload = {
    bookingId: bookingId,
    timestamp: new Date().toISOString(),
    studentName: name,
    studentEmail: email,
    studentPhone: phone,
    sessionType: sessionType,
    surah: surah,
    riwayah: riwayah,
    notes: notes,
    date: state.selectedDate,
    time: state.selectedSlot.timeFormatted,
    startTimeIso: state.selectedSlot.isoStartTime,
    endTimeIso: state.selectedSlot.isoEndTime,
    duration: state.settings.sessionDuration,
    teacherName: state.settings.teacherName,
    meetingUrl: state.settings.meetingUrl
  };

  state.lastBooking = bookingPayload;

  // Save to local storage history
  try {
    const history = JSON.parse(localStorage.getItem('quran_bookings_history') || '[]');
    history.unshift(bookingPayload);
    localStorage.setItem('quran_bookings_history', JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.error("Local storage error:", err);
  }

  // Send to Webhook (Google Apps Script) if configured
  if (state.settings.webhookUrl) {
    try {
      await fetch(state.settings.webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Standard for Google Apps Script Webhook
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(bookingPayload)
      });
      console.log("Webhook triggered successfully");
    } catch (webhookErr) {
      console.warn("Webhook dispatch failed or was blocked by network:", webhookErr);
      // We don't block the user if webhook encounters network issues
    }
  }

  state.isSubmitting = false;
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;

  // Move to confirmation
  goToStep(3);
}

// --- Step 3: Confirmation & Calendar Actions ---
function setupStep3Confirmation() {
  const b = state.lastBooking;
  if (!b) return;

  setText('confirm-name', b.studentName);
  setText('confirm-session-type', b.sessionType);
  setText('confirm-surah', `سورة ${b.surah} (${b.riwayah})`);
  setText('confirm-time', `${b.date} • ${b.time} (${b.duration} دقيقة)`);
  setText('confirm-teacher', b.teacherName);
  setText('confirm-booking-id', b.bookingId);

  // Trigger celebration confetti!
  triggerConfetti();

  // Setup Google Calendar Link
  const gcalBtn = document.getElementById('btn-add-gcal');
  if (gcalBtn) {
    gcalBtn.onclick = () => {
      const gcalUrl = buildGoogleCalendarUrl(b);
      window.open(gcalUrl, '_blank');
    };
  }

  // Setup iCalendar (.ics) download
  const icsBtn = document.getElementById('btn-download-ics');
  if (icsBtn) {
    icsBtn.onclick = () => {
      downloadICSFile(b);
    };
  }

  // Setup Meeting Link
  const meetBtn = document.getElementById('btn-open-meeting');
  if (meetBtn) {
    meetBtn.href = b.meetingUrl || '#';
  }

  // Setup WhatsApp Direct Confirmation
  const waBtn = document.getElementById('btn-share-whatsapp');
  if (waBtn) {
    const waText = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته يا فضيلة الشيخ، تم حجز موعد لتسميع القرآن الكريم:\n\n` +
      `👤 الطالب: ${b.studentName}\n` +
      `📅 الموعد: ${b.date} الساعة ${b.time}\n` +
      `📖 المطلوب: ${b.sessionType} - سورة ${b.surah} (${b.riwayah})\n` +
      `🏷️ رقم الحجز: ${b.bookingId}\n\nجزاكم الله خيراً ونفع بكم.`
    );
    waBtn.href = `https://wa.me/?text=${waText}`;
  }
}

// --- Calendar URLs and ICS Generators ---
function buildGoogleCalendarUrl(b) {
  const title = encodeURIComponent(`جلسة قرآنية: ${b.studentName} - ${b.sessionType}`);
  const details = encodeURIComponent(
    `جلسة تسميع وإتقان للقرآن الكريم\n` +
    `الطالب: ${b.studentName}\n` +
    `السورة: ${b.surah} (${b.riwayah})\n` +
    `رابط اللقاء: ${b.meetingUrl}\n` +
    `رقم الهاتف: ${b.studentPhone}`
  );
  const location = encodeURIComponent(b.meetingUrl || "Google Meet");

  const startUtc = formatIsoToCalUtc(b.startTimeIso);
  const endUtc = formatIsoToCalUtc(b.endTimeIso);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;
}

function downloadICSFile(b) {
  const startUtc = formatIsoToCalUtc(b.startTimeIso);
  const endUtc = formatIsoToCalUtc(b.endTimeIso);

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Quran Booking//AR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${b.bookingId}@quran-booking.pages.dev`,
    `DTSTAMP:${formatIsoToCalUtc(new Date().toISOString())}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:جلسة قرآنية: ${b.studentName} - ${b.sessionType}`,
    `DESCRIPTION:جلسة تسميع سورة ${b.surah} مع ${b.teacherName}\\nرابط اللقاء: ${b.meetingUrl}`,
    `LOCATION:${b.meetingUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `quran-booking-${b.bookingId}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- Helper Functions ---
function padZero(num) {
  return num < 10 ? '0' + num : num;
}

function formatDateISO(d) {
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

function formatTime12(h, m) {
  const suffix = h >= 12 ? 'م' : 'ص';
  const hour12 = h % 12 || 12;
  return `${padZero(hour12)}:${padZero(m)} ${suffix}`;
}

function formatIsoToCalUtc(isoStr) {
  const d = new Date(isoStr);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#34d399', '#f59e0b', '#ffffff']
    });
  }
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-rose-600' : (type === 'success' ? 'bg-emerald-600' : 'bg-slate-800');
  
  toast.className = `${bgClass} text-white text-sm font-medium py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0`;
  toast.innerHTML = `
    <i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" class="w-4 h-4"></i>
    <span>${msg}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Bind Application Events ---
function bindEvents() {
  // Theme Toggle Button
  const themeBtn = document.getElementById('btn-toggle-theme');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Month navigation
  const prevMonthBtn = document.getElementById('btn-prev-month');
  const nextMonthBtn = document.getElementById('btn-next-month');
  
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1);
      renderCalendar();
    });
  }

  // Back to Calendar Button (Step 2 -> Step 1)
  const backBtn = document.getElementById('btn-back-to-cal');
  if (backBtn) {
    backBtn.addEventListener('click', () => goToStep(1));
  }

  // New Booking Button (Step 3 -> Step 1)
  const newBookingBtn = document.getElementById('btn-new-booking');
  if (newBookingBtn) {
    newBookingBtn.addEventListener('click', () => {
      document.getElementById('booking-form').reset();
      goToStep(1);
    });
  }

  // Booking Form Submission
  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Settings Modal Controls
  const settingsBtn = document.getElementById('btn-open-settings');
  const closeSettingsBtn = document.getElementById('btn-close-settings');
  const settingsModal = document.getElementById('settings-modal');
  const settingsForm = document.getElementById('settings-form');
  const resetSettingsBtn = document.getElementById('btn-reset-settings');

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      populateSettingsForm();
      settingsModal.classList.remove('hidden');
    });
  }

  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }

  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', resetSettings);
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        teacherName: document.getElementById('set-teacher-name').value.trim(),
        teacherTitle: document.getElementById('set-teacher-title').value.trim(),
        teacherAvatar: document.getElementById('set-teacher-avatar').value.trim(),
        sessionTitle: document.getElementById('set-session-title').value.trim(),
        sessionDescription: document.getElementById('set-session-desc').value.trim(),
        sessionDuration: parseInt(document.getElementById('set-session-duration').value, 10),
        meetingPlatform: document.getElementById('set-meeting-platform').value.trim(),
        meetingUrl: document.getElementById('set-meeting-url').value.trim(),
        webhookUrl: document.getElementById('set-webhook-url').value.trim(),
        workHoursStart: document.getElementById('set-work-start').value,
        workHoursEnd: document.getElementById('set-work-end').value,
        breakHoursStart: document.getElementById('set-break-start').value,
        breakHoursEnd: document.getElementById('set-break-end').value,
        workingDays: Array.from(document.querySelectorAll('input[name="work-days"]:checked')).map(cb => parseInt(cb.value, 10))
      };

      saveSettings(updated);
      settingsModal.classList.add('hidden');
    });
  }
}

function populateSettingsForm() {
  const s = state.settings;
  setValue('set-teacher-name', s.teacherName);
  setValue('set-teacher-title', s.teacherTitle);
  setValue('set-teacher-avatar', s.teacherAvatar);
  setValue('set-session-title', s.sessionTitle);
  setValue('set-session-desc', s.sessionDescription);
  setValue('set-session-duration', s.sessionDuration);
  setValue('set-meeting-platform', s.meetingPlatform);
  setValue('set-meeting-url', s.meetingUrl);
  setValue('set-webhook-url', s.webhookUrl);
  setValue('set-work-start', s.workHoursStart);
  setValue('set-work-end', s.workHoursEnd);
  setValue('set-break-start', s.breakHoursStart);
  setValue('set-break-end', s.breakHoursEnd);

  // Checkboxes for days
  document.querySelectorAll('input[name="work-days"]').forEach(cb => {
    cb.checked = s.workingDays.includes(parseInt(cb.value, 10));
  });
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

