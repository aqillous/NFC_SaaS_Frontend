import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Star,
} from "lucide-react";
import * as api from "../lib/api";
import rateUpLogo from "../images/RateUp_logo.png";

const LANGUAGES = ["az", "ru", "en"];
const REASONS = ["service_speed", "staff_attitude", "product_quality"];

const COPY = {
  az: {
    question: "Xidmətimizdən razı qaldınız?",
    intro: "Qiymətləndirməniz xidmətimizi daha da yaxşılaşdırmağa kömək edir.",
    ratePrompt: "Ulduz sayını seçin",
    oneStar: "1 ulduz",
    stars: "ulduz",
    googleChoice: "Google-da rəy paylaş",
    businessChoice: "Bizneslə paylaş",
    businessTitle: "Nəyi yaxşılaşdıra bilərik?",
    businessIntro: "Uyğun olan bütün səbəbləri seçin. İstəsəniz əlavə şərh də yaza bilərsiniz.",
    reasons: {
      service_speed: "Xidmətin sürəti.",
      staff_attitude: "İşçi heyətinin münasibəti.",
      product_quality: "Məhsulun və ya xidmətin keyfiyyəti.",
    },
    commentLabel: "Əlavə şərh",
    commentPlaceholder: "Fikirlərinizi bizimlə bölüşün…",
    send: "Göndər",
    sending: "Göndərilir…",
    chooseReason: "Davam etmək üçün ən azı bir səbəb seçin.",
    thankTitle: "Rəyinizə görə təşəkkürlər!",
    thankMessage: "Rəyiniz bizim üçün önəmlidir.",
    keepReview: "Rəyiniz bizimlə qalsın",
    googleReview: "Rəyinizi Google-da paylaşın",
    keptPrivate: "Rəyiniz bizneslə paylaşıldı və Google-a yönləndirilməyəcək.",
    failed: "Rəyinizi göndərmək mümkün olmadı. Yenidən cəhd edin.",
    googleUnavailable: "Google rəy səhifəsi hazırda əlçatan deyil.",
    loadFailed: "Rəy səhifəsini yükləmək mümkün olmadı.",
    notFound: "Bu rəy linki tapılmadı.",
    unavailable: "Bu rəy linki hazırda aktiv deyil.",
    loading: "Səhifə yüklənir…",
    language: "Dil",
  },
  ru: {
    question: "Вам понравилось наше обслуживание?",
    intro: "Ваша оценка поможет нам стать лучше.",
    ratePrompt: "Выберите количество звёзд",
    oneStar: "1 звезда",
    stars: "звёзд",
    googleChoice: "Оставить отзыв в Google",
    businessChoice: "Поделиться с компанией",
    businessTitle: "Что нам стоит улучшить?",
    businessIntro: "Выберите все подходящие причины. При желании оставьте комментарий.",
    reasons: {
      service_speed: "Скорость обслуживания.",
      staff_attitude: "Отношение сотрудников.",
      product_quality: "Качество товара или услуги.",
    },
    commentLabel: "Дополнительный комментарий",
    commentPlaceholder: "Поделитесь своими мыслями…",
    send: "Отправить",
    sending: "Отправка…",
    chooseReason: "Выберите хотя бы одну причину.",
    thankTitle: "Спасибо за ваш отзыв!",
    thankMessage: "Ваше мнение важно для нас.",
    keepReview: "Оставить отзыв у нас",
    googleReview: "Поделиться отзывом в Google",
    keptPrivate: "Отзыв отправлен компании и не будет опубликован в Google.",
    failed: "Не удалось отправить отзыв. Попробуйте ещё раз.",
    googleUnavailable: "Страница отзывов Google сейчас недоступна.",
    loadFailed: "Не удалось загрузить страницу отзывов.",
    notFound: "Ссылка на отзыв не найдена.",
    unavailable: "Эта ссылка на отзыв сейчас не активна.",
    loading: "Загрузка страницы…",
    language: "Язык",
  },
  en: {
    question: "Were you satisfied with our service?",
    intro: "Your rating helps us make our service even better.",
    ratePrompt: "Choose a star rating",
    oneStar: "1 star",
    stars: "stars",
    googleChoice: "Share a Google review",
    businessChoice: "Share with the business",
    businessTitle: "What could we improve?",
    businessIntro: "Select all that apply. You can also leave an additional comment.",
    reasons: {
      service_speed: "Service speed.",
      staff_attitude: "Staff attitude.",
      product_quality: "Product or service quality.",
    },
    commentLabel: "Additional comment",
    commentPlaceholder: "Tell us what you think…",
    send: "Send",
    sending: "Sending…",
    chooseReason: "Select at least one reason to continue.",
    thankTitle: "Thank you for your feedback!",
    thankMessage: "Your feedback is important to us.",
    keepReview: "Keep your review with us",
    googleReview: "Share your review on Google",
    keptPrivate: "Your feedback was shared with the business and won't be sent to Google.",
    failed: "We couldn't send your feedback. Please try again.",
    googleUnavailable: "The Google review page is unavailable right now.",
    loadFailed: "We couldn't load this review page.",
    notFound: "This review link could not be found.",
    unavailable: "This review link is currently unavailable.",
    loading: "Loading your page…",
    language: "Language",
  },
};

export default function PublicReview() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isBusinessPage = location.pathname.endsWith("/business");
  const routeRating = Number(
    location.state?.rating || new URLSearchParams(location.search).get("rating") || 0,
  );
  const [language, setLanguage] = useState(
    () => {
      const savedLanguage = localStorage.getItem("rateup_public_language");
      return LANGUAGES.includes(savedLanguage) ? savedLanguage : "az";
    },
  );
  const [entity, setEntity] = useState(null);
  const [googleUrl, setGoogleUrl] = useState("");
  const [rating, setRating] = useState(routeRating);
  const [reasons, setReasons] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [introFinished, setIntroFinished] = useState(isBusinessPage);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [keptPrivate, setKeptPrivate] = useState(false);
  const t = COPY[language] || COPY.az;

  useEffect(() => {
    localStorage.setItem("rateup_public_language", language);
  }, [language]);

  useEffect(() => {
    if (isBusinessPage) {
      setIntroFinished(true);
      return undefined;
    }

    setIntroFinished(false);
    const timer = window.setTimeout(() => setIntroFinished(true), 1000);
    return () => window.clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setEntity(null);
    setGoogleUrl("");
    setError("");

    api.getPublicReview(slug)
      .then(({ data }) => {
        if (!active) return;
        setEntity(data.entity);
        setGoogleUrl(data.google_review_url || "");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.status === 404
            ? "notFound"
            : err.response?.status === 403
              ? "unavailable"
              : "loadFailed",
        );
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (isBusinessPage && (routeRating < 1 || routeRating > 5)) {
      navigate(`/r/${slug}`, { replace: true });
    } else if (routeRating >= 1 && routeRating <= 5) {
      setRating(routeRating);
    }
  }, [isBusinessPage, navigate, routeRating, slug]);

  const chooseGoogle = () => {
    if (!googleUrl) {
      setError("googleUnavailable");
      return;
    }

    window.location.assign(googleUrl);
  };

  const chooseBusiness = () => {
    if (!rating) return;
    navigate(`/r/${slug}/business?rating=${rating}`, { state: { rating } });
  };

  const submitBusinessFeedback = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (reasons.length === 0) {
      setError(t.chooseReason);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.submitFeedback(slug, {
        quality: rating,
        service: rating,
        taste: rating,
        comment: comment.trim() || null,
        reasons,
        redirected_to_google: false,
      });
      setComplete(true);
    } catch (err) {
      setError(apiErrorMessage(err, t.failed));
    } finally {
      setSubmitting(false);
    }
  };

  const openGoogleReview = () => {
    if (!googleUrl) {
      setError("googleUnavailable");
      return;
    }
    window.location.assign(googleUrl);
  };

  if (!introFinished || loading) {
    return (
      <PublicShell language={language} setLanguage={setLanguage} t={t}>
        {!introFinished ? (
          <div className="rateup-intro mx-auto flex min-h-[65vh] max-w-sm items-center justify-center">
            <img src={rateUpLogo} alt="RateUp" className="w-56 max-w-[75vw] object-contain" />
          </div>
        ) : (
          <LoadingState message={t.loading} />
        )}
      </PublicShell>
    );
  }

  if (!entity) {
    return (
      <PublicShell language={language} setLanguage={setLanguage} t={t}>
        <UnavailableState message={t[error] || t.loadFailed} />
      </PublicShell>
    );
  }

  if (complete) {
    return (
      <PublicShell language={language} setLanguage={setLanguage} t={t}>
        <ThankYou
          t={t}
          googleUrl={googleUrl}
          keptPrivate={keptPrivate}
          onKeepPrivate={() => setKeptPrivate(true)}
          onGoogle={openGoogleReview}
          error={error}
        />
      </PublicShell>
    );
  }

  if (isBusinessPage) {
    return (
      <PublicShell language={language} setLanguage={setLanguage} t={t}>
        <section className="mx-auto w-full max-w-lg rounded-3xl border border-ink-100 bg-white p-5 shadow-panel sm:p-8">
          <button
            type="button"
            onClick={() => navigate(`/r/${slug}`)}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft size={16} /> {t.question}
          </button>
          <div className="mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-500/10 text-signal-600">
              <MessageSquareText size={23} />
            </div>
            <p className="text-sm font-semibold text-signal-600">{entity.name}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              {t.businessTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-400">{t.businessIntro}</p>
          </div>

          <form onSubmit={submitBusinessFeedback}>
            <fieldset className="space-y-3">
              <legend className="sr-only">{t.businessTitle}</legend>
              {REASONS.map((reason) => {
                const checked = reasons.includes(reason);
                return (
                  <label
                    key={reason}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      checked
                        ? "border-signal-500 bg-signal-500/5 text-ink-900"
                        : "border-ink-100 text-ink-700 hover:border-ink-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setError("");
                        setReasons((current) =>
                          checked
                            ? current.filter((item) => item !== reason)
                            : [...current, reason],
                        );
                      }}
                      className="h-4 w-4 accent-signal-600"
                    />
                    {t.reasons[reason]}
                  </label>
                );
              })}
            </fieldset>

            <label htmlFor="feedback-comment" className="field-label mt-5">
              {t.commentLabel}
            </label>
            <textarea
              id="feedback-comment"
              className="input-field min-h-28 resize-y"
              maxLength={2000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t.commentPlaceholder}
            />
            <p className="mt-1 text-right text-xs text-ink-300">{comment.length}/2000</p>

            {error && <InlineError message={error === "googleUnavailable" ? t.googleUnavailable : error} />}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-signal-600 px-5 text-sm font-bold text-white transition hover:bg-signal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <><Loader2 size={17} className="animate-spin" />{t.sending}</> : t.send}
            </button>
          </form>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell language={language} setLanguage={setLanguage} t={t}>
      <section className="mx-auto w-full max-w-lg rounded-3xl border border-ink-100 bg-white p-5 text-center shadow-panel sm:p-8">
        <img src={rateUpLogo} alt="RateUp" className="mx-auto mb-6 h-10 max-w-36 object-contain" />
        <p className="text-sm font-semibold text-signal-600">{entity.name}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {t.question}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-400">{t.intro}</p>

        <fieldset className="mt-7">
          <legend className="mb-3 w-full text-sm font-semibold text-ink-700">{t.ratePrompt}</legend>
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={value === 1 ? t.oneStar : `${value} ${t.stars}`}
                aria-pressed={rating === value}
                onClick={() => {
                  setRating(value);
                  setError("");
                }}
                className="flex h-12 w-12 items-center justify-center rounded-xl transition hover:bg-amber-500/10 sm:h-14 sm:w-14"
              >
                <Star
                  size={32}
                  strokeWidth={1.7}
                  className={value <= rating ? "fill-amber-400 text-amber-400" : "text-ink-200"}
                />
              </button>
            ))}
          </div>
        </fieldset>

        {rating > 0 && (
          <div className="mt-7 space-y-3">
            <button
              type="button"
              onClick={chooseGoogle}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-60"
            >
              <ExternalLink size={17} />
              {t.googleChoice}
            </button>
            <button
              type="button"
              onClick={chooseBusiness}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-ink-100 bg-white px-5 text-sm font-bold text-ink-800 transition hover:bg-ink-50"
            >
              <MessageSquareText size={17} />
              {t.businessChoice}
            </button>
          </div>
        )}

        {error && <InlineError message={error === "googleUnavailable" ? t.googleUnavailable : error} />}
      </section>
    </PublicShell>
  );
}

function PublicShell({ children, language, setLanguage, t }) {
  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#ffffff_0,_#f3f6f8_58%,_#e9eef1_100%)] px-4 py-5 sm:py-8">
      <div className="mx-auto flex w-full max-w-lg justify-end">
        <label className="flex items-center gap-2 text-xs font-medium text-ink-400">
          {t.language}
          <select
            aria-label={t.language}
            className="rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-xs text-ink-700"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>{code.toUpperCase()}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center py-4">
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}

function ThankYou({ t, googleUrl, keptPrivate, onKeepPrivate, onGoogle, error }) {
  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-ink-100 bg-white p-6 text-center shadow-panel sm:p-9">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-signal-500/10 text-signal-600">
        <CheckCircle2 size={30} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
        {t.thankTitle}
      </h1>
      <p className="mt-2 text-sm leading-6 text-ink-400">{t.thankMessage}</p>
      <div className="mt-7 grid gap-3">
        <button
          type="button"
          onClick={onKeepPrivate}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-signal-600 px-5 text-sm font-bold text-white transition hover:bg-signal-700"
        >
          {t.keepReview}
        </button>
        <button
          type="button"
          disabled={!googleUrl}
          onClick={onGoogle}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-ink-100 bg-white px-5 text-sm font-bold text-ink-800 transition hover:bg-ink-50 disabled:opacity-50"
        >
          <ExternalLink size={16} />
          {t.googleReview}
        </button>
      </div>
      {keptPrivate && <p className="mt-4 text-sm text-signal-700">{t.keptPrivate}</p>}
      {error && <InlineError message={error === "googleUnavailable" ? t.googleUnavailable : error} />}
    </section>
  );
}

function InlineError({ message }) {
  return (
    <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-rust-500/5 p-3 text-left text-sm text-rust-500">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function apiErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item?.msg)
      .filter((message) => typeof message === "string");
    if (messages.length) return messages.join(". ");
  }
  return fallback;
}

function LoadingState({ message }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-ink-100 bg-white p-10 text-center shadow-panel">
      <Loader2 size={28} className="mx-auto animate-spin text-signal-500" />
      <p className="mt-4 text-sm font-medium text-ink-600">{message}</p>
    </div>
  );
}

function UnavailableState({ message }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-50 text-ink-500">
        <AlertCircle size={26} />
      </div>
      <p className="mt-5 text-sm leading-6 text-ink-400">{message}</p>
    </div>
  );
}
