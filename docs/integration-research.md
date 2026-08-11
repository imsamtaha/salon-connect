# نتائج التحقق من تكامل WhatsApp Business وTelegram

## WhatsApp Business Platform

وثائق Meta الرسمية المحدثة في 26 يونيو 2026 تؤكد أن WhatsApp Business Platform يستخدم Webhooks عبر طلبات HTTP تحتوي JSON يرسلها خادم Meta إلى خادم التطبيق. تصل أحداث الرسائل الواردة، وحالات الرسائل الصادرة، وبعض تغييرات الحساب والقوالب. يتطلب استقبال Webhooks صلاحية `whatsapp_business_messaging` لأحداث الرسائل والمكالمات، و`whatsapp_business_management` لبقية الأحداث. يجب إنشاء نقطة Webhook عامة على HTTPS، ويمكن استخدام نقطة اختبار أثناء التطوير، لكنها لا تكفي للإنتاج. إرسال الإشعارات خارج نافذة المحادثة النشطة يحتاج قوالب رسائل معتمدة من Meta، لذلك ستُصمم الرسائل حول قوالب utility للمواعيد والتذكيرات والموافقات.

المصدر: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview

## Telegram Bot API

وثائق Telegram الرسمية تؤكد أن `setWebhook` يرسل تحديثات البوت عبر HTTPS POST إلى عنوان محدد بصيغة JSON من نوع `Update`. عند فشل الاستجابة برمز HTTP من فئة غير 2xx، تعيد Telegram المحاولة عدداً معقولاً من المرات. يمكن حماية Webhook باستخدام `secret_token`، الذي يصل في رأس `X-Telegram-Bot-Api-Secret-Token`. سيستخدم التطبيق هذا للتحقق من الرسائل الواردة، مع `allowed_updates` لتقليل نطاق الأحداث، و`sendMessage` لإشعارات المواعيد والملاحظات.

المصدر: https://core.telegram.org/bots/api

## القرار الهندسي

يُنفذ التكامل على خادم التطبيق عبر موصلين مستقلين، ولا تُحفظ الرموز في تطبيق الهاتف. كل حدث داخلي للحجز ينشئ سجل إرسال بمعرّف فريد، ثم يرسل للقناة المفعلة في وضع تجريبي أو فعلي. يجب منع التكرار، تسجيل حالة التسليم، وإبقاء الإشعار داخل التطبيق كبديل عند فشل قناة خارجية.
