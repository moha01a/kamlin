const SUPABASE_URL = "https://hxphmxkimjxngsrlxcjn.supabase.co";
const SUPABASE_KEY = "sb_publishable_V-vK8enWv_NNYbigWPSkhA_gq-D8s0t";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const PRICE_FIELDS = [
  "priceRegular", "priceDeep", "priceConstruction", "priceVillas",
  "priceCompanies", "priceClinics", "priceSofa", "priceMattress",
  "priceDisinfectSmall", "priceDisinfectMedium", "priceDisinfectLarge",
  "priceAnts", "priceCockroaches", "priceFlying", "priceRodents",
  "priceBedbugs", "priceEconomic", "priceComplete", "priceShine",
  "priceRoyal", "priceMonthly4", "priceMonthly8", "priceMonthly12"
];

function makeReference() {
  return `KML-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

async function createBooking(data) {
  const item = {
    id: makeReference(),
    name: data.name?.trim() || "",
    phone: data.phone?.trim() || "",
    service: data.service || "",
    area: data.area?.trim() || "",
    notes: data.notes?.trim() || "",
    status: "جديد",
    source: "الموقع"
  };

  const { error } = await sb.from("bookings").insert(item);
  if (error) throw error;
  return item;
}

function validPhone(phone) {
  return String(phone).replace(/\D/g, "").length >= 10;
}

function bindForm(id, statusId) {
  const form = document.getElementById(id);
  const status = document.getElementById(statusId);
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    if (!validPhone(data.phone)) {
      status.className = "form-status error";
      status.textContent = "يرجى إدخال رقم هاتف صحيح.";
      return;
    }

    submit.disabled = true;
    status.className = "form-status";
    status.textContent = "جارٍ إرسال الطلب...";

    try {
      const item = await createBooking(data);
      status.className = "form-status success";
      status.textContent = `تم استلام الطلب بنجاح. رقم الطلب: ${item.id}`;
      form.reset();
    } catch (error) {
      console.error("تعذر إرسال الحجز:", error);
      status.className = "form-status error";
      status.textContent = "تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى أو التواصل عبر واتساب.";
    } finally {
      submit.disabled = false;
    }
  });
}

async function loadPrices() {
  try {
    const { data, error } = await sb
      .from("site_settings")
      .select("value")
      .eq("key", "prices")
      .maybeSingle();

    if (error) throw error;
    const prices = data?.value || {};

    PRICE_FIELDS.forEach((key) => {
      document.querySelectorAll(`[data-price="${key}"]`).forEach((element) => {
        const value = Number(prices[key]);
        if (Number.isFinite(value) && value > 0) {
          element.textContent = `${value.toLocaleString("ar-EG")} ج.م`;
        }
      });
    });
  } catch (error) {
    console.error("تعذر تحميل الأسعار:", error);
  }
}

bindForm("quickBooking", "quickStatus");
bindForm("bookingForm", "bookingStatus");
loadPrices();

function bookService(service) {
  const select = document.getElementById("serviceSelect");
  if (select) select.value = service;
  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
}

function toggleMenu() {
  document.getElementById("mainNav")?.classList.toggle("open");
}

document.getElementById("year").textContent = new Date().getFullYear();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("تعذر تشغيل التطبيق على الهاتف:", error);
    });
  });
}
