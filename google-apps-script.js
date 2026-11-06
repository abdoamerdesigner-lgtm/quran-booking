/**
 * Google Apps Script - كود استقبال حجوزات منصة التسميع القرآني
 * -------------------------------------------------------------
 * الوظيفة:
 * 1. يستقبل بيانات الحجز عبر Webhook POST من الواجهة.
 * 2. يسجل بيانات الحجز تلقائياً في صف جديد داخل Google Sheets.
 * 3. ينشئ حدثاً فورياً في Google Calendar مع رابط اللقاء والتفاصيل.
 * 4. يرسل دعوة تلقائية لتقويم الطالب عبر بريده الإلكتروني.
 *
 * طريقة التركيب (في أقل من دقيقتين):
 * 1. افتح جدول بيانات جديد في Google Sheets (سمِّه مثلاً: "حجوزات التسميع القرآني").
 * 2. من القائمة العلوية اختر: الإضافات (Extensions) -> Apps Script.
 * 3. امسح أي كود موجود والصق هذا الكود بالكامل بدلاً منه.
 * 4. اضغط زر الحفظ (Save).
 * 5. اضغط على زر "Deploy" (نشر) بالأعلى -> "New deployment" (نشر جديد).
 * 6. اختر نوع النشر: "Web app" (تطبيق ويب).
 * 7. الإعدادات المهمة:
 *    - Execute as: "Me" (أنا)
 *    - Who has access: "Anyone" (أي شخص)  <-- ضروري جداً ليعمل دون تسجيل دخول
 * 8. اضغط Deploy وامنح الأذونات المطلوبة (Authorize access).
 * 9. انسخ رابط الـ Web App URL والصقه في شاشة إعدادات الواجهة (Settings) في الموقع!
 */

function doPost(e) {
  try {
    // 1. قراءة البيانات المرسلة
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    // 2. الوصول لجدول البيانات الحالي
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // إذا كان الجدول فارغاً، ننشئ صف العناوين أولاً
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "وقت التسجيل",
        "رقم الحجز",
        "اسم الطالب",
        "البريد الإلكتروني",
        "رقم الواتساب",
        "نوع الجلسة",
        "السورة / المقطع",
        "الرواية",
        "تاريخ الموعد",
        "الوقت",
        "المدة (دقيقة)",
        "رابط اللقاء",
        "ملاحظات"
      ]);
      // تلوين وترتيب صف العناوين
      sheet.getRange(1, 1, 1, 13).setBackground("#064e3b").setFontColor("#ffffff").setFontWeight("bold");
    }

    // 3. إضافة بيانات الحجز كصف جديد
    sheet.appendRow([
      new Date().toLocaleString("ar-SA"),
      data.bookingId || "QRN-NA",
      data.studentName || "",
      data.studentEmail || "",
      data.studentPhone || "",
      data.sessionType || "",
      data.surah || "",
      data.riwayah || "",
      data.date || "",
      data.time || "",
      data.duration || 20,
      data.meetingUrl || "",
      data.notes || ""
    ]);

    // 4. إنشاء موعد تلقائي في تقويم Google (Google Calendar)
    try {
      if (data.startTimeIso && data.endTimeIso) {
        var startTime = new Date(data.startTimeIso);
        var endTime = new Date(data.endTimeIso);
        var cal = CalendarApp.getDefaultCalendar();

        var eventTitle = "جلسة قرآنية: " + data.studentName + " - " + (data.sessionType || "تسميع");
        var eventDescription = 
          "جلسة تسميع وإتقان للقرآن الكريم\n" +
          "👤 الطالب: " + data.studentName + "\n" +
          "📖 السورة/المقطع: " + data.surah + " (" + data.riwayah + ")\n" +
          "📞 الهاتف/الواتساب: " + data.studentPhone + "\n" +
          "🔗 رابط اللقاء: " + (data.meetingUrl || "Google Meet") + "\n" +
          "📝 ملاحظات: " + (data.notes || "لا توجد");

        var event = cal.createEvent(eventTitle, startTime, endTime, {
          description: eventDescription,
          location: data.meetingUrl || "Google Meet",
          guests: data.studentEmail,
          sendInvites: true // يرسل دعوة لتقويم الطالب
        });
      }
    } catch (calError) {
      Logger.log("Calendar creation notice: " + calError.toString());
    }

    // 5. إرجاع استجابة نجاح بصيغة JSON
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "تم حفظ الحجز وإنشاء الموعد بنجاح",
      bookingId: data.bookingId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// اختبار أولي للسيرفر (عند فتح الرابط في المتصفح عبر GET)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Quran Booking Webhook Service",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

