import { useState } from "react";
import { useMerchantAuth } from "./merchantContext";
import {
  MessageCircle, Send, Phone, Mail, MapPin, Clock,
  HelpCircle, FileText, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp
} from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "كيف يمكنني الاطلاع على كشف حسابي؟",
    answer: "يمكنك الاطلاع على كشف حسابك الكامل من خلال الضغط على 'كشف الحساب' في القائمة الجانبية. يمكنك أيضاً تصفية الحركات حسب التاريخ والبحث في التفاصيل."
  },
  {
    question: "كيف أعرف رصيدي المتبقي؟",
    answer: "رصيدك المتبقي يظهر في لوحة التحكم الرئيسية بشكل واضح، كما يظهر في أسفل جدول كشف الحساب. الرصيد يُحدّث تلقائياً مع كل حركة جديدة."
  },
  {
    question: "كيف أطبع كشف الحساب؟",
    answer: "في صفحة كشف الحساب، ستجد أزرار التصدير والطباعة في شريط الأدوات أعلى الجدول. يمكنك تصدير الكشف بصيغة PDF أو Excel أو طباعته مباشرة."
  },
  {
    question: "ما هو الفرق بين 'المطلوب' و'المسدد'؟",
    answer: "'المطلوب' هو إجمالي مبالغ الفواتير المسجلة عليك. 'المسدد' هو إجمالي المبالغ التي قمت بدفعها. الفرق بينهما هو 'الرصيد المتبقي' الذي يمثل المبلغ المستحق."
  },
  {
    question: "لماذا لا تظهر بعض الحركات؟",
    answer: "تأكد من إزالة فلتر التاريخ إذا كنت تبحث عن حركات قديمة. كما يمكنك استخدام خانة البحث للعثور على حركة محددة برقم الوصل أو الملاحظات."
  },
];

const REQUEST_TYPES = [
  { id: "inquiry", label: "استفسار عام", icon: HelpCircle },
  { id: "statement", label: "طلب كشف حساب مفصل", icon: FileText },
  { id: "dispute", label: "اعتراض على حركة", icon: AlertTriangle },
  { id: "other", label: "طلب آخر", icon: MessageCircle },
];

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-right hover:bg-secondary/50 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">{question}</span>
        {isOpen ? (
          <ChevronUp size={18} className="text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function MerchantSupportPage() {
  const { user } = useMerchantAuth();
  const [requestType, setRequestType] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestType || !message.trim()) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setRequestType("");
    setMessage("");
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">التواصل مع الإدارة</h2>
        <p className="text-sm text-muted-foreground mt-1">أرسل استفساراتك وطلباتك وسنرد عليك في أقرب وقت</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Message Form */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/30">
              <h3 className="text-base font-bold text-foreground">إرسال طلب جديد</h3>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2">تم إرسال طلبك بنجاح</h4>
                <p className="text-sm text-muted-foreground mb-6">سيتم الرد عليك في أقرب وقت ممكن خلال ساعات العمل الرسمية</p>
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  إرسال طلب آخر
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Request Type */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">نوع الطلب</label>
                  <div className="grid grid-cols-2 gap-2">
                    {REQUEST_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setRequestType(type.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                            requestType === type.id
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary/50"
                          }`}
                        >
                          <Icon size={16} className={requestType === type.id ? "text-primary" : "text-muted-foreground"} />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">تفاصيل الطلب</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="اكتب تفاصيل طلبك أو استفسارك هنا..."
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm text-foreground placeholder:text-muted-foreground resize-none"
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!requestType || !message.trim() || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      <span>جارٍ الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>إرسال الطلب</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/30">
              <h3 className="text-base font-bold text-foreground">الأسئلة الشائعة</h3>
            </div>
            <div className="p-4 space-y-2">
              {FAQ_ITEMS.map((item, idx) => (
                <FAQItem key={idx} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact Card */}
          <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
            <h4 className="text-base font-bold mb-4">معلومات التواصل</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-xs opacity-60">الهاتف</p>
                  <p className="text-sm font-medium" dir="ltr">+964 XXX XXX XXXX</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-xs opacity-60">البريد الإلكتروني</p>
                  <p className="text-sm font-medium" dir="ltr">support@alrawi.iq</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs opacity-60">العنوان</p>
                  <p className="text-sm font-medium">بغداد، العراق</p>
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">ساعات العمل</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">السبت - الخميس</span>
                <span className="font-semibold text-foreground" dir="ltr">8:00 - 16:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الجمعة</span>
                <span className="font-semibold text-destructive">مغلق</span>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h4 className="text-sm font-bold text-foreground mb-3">معلومات حسابك</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">اسم المستخدم</span>
                <span className="font-medium text-foreground">{user?.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الاسم الكامل</span>
                <span className="font-medium text-foreground">{user?.fullName || user?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">حالة الحساب</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  نشط
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
