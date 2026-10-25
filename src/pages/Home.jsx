import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Heart,
  MessageCircle,
  Camera,
  Upload,
  X,
  CheckCircle2,
  Sparkles,
  Send,
  User,
  Phone,
  FileText,
  Lock,
  ExternalLink,
  EyeOff,
  UserCheck,
  Shield
} from 'lucide-react';

import homeHeroBgWebp from '../assets/images/home-hero-bg.webp';
import homeHeroBgPng from '../assets/images/home-hero-bg.png';
import studyToolsWebp from '../assets/images/study-tools-faded.webp';
import studyToolsPng from '../assets/images/study-tools-faded.png';
import dentalBoxesWebp from '../assets/images/dental-boxes-faded.webp';
import dentalBoxesPng from '../assets/images/dental-boxes-faded.png';
import productRequestWebp from '../assets/images/product-request-faded.webp';
import productRequestPng from '../assets/images/product-request-faded.png';

import {
  fetchPublishedExperiences,
  submitStudentExperience,
  toggleExperienceLike,
  addExperienceComment,
  submitProductAvailabilityRequest,
  validateImageFile
} from '../utils/communityAndRequestsEngine';

const DRAFT_STORAGE_KEY = 'ad_product_request_draft';
const POST_AUTH_ACTION_KEY = 'ad_post_auth_action';

export const Home = () => {
  const { lang, isRtl } = useLanguage();
  const { user, profile, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const isLoggedInStudent = Boolean(user && user.email !== 'admin@smylodent.com');

  // ── Student Experiences State ──
  const [experiences, setExperiences] = useState([]);
  const [loadingExperiences, setLoadingExperiences] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSubmittingId, setCommentSubmittingId] = useState(null);
  const [likeBusyId, setLikeBusyId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // ── Modals State ──
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState('');
  const [addExpModalOpen, setAddExpModalOpen] = useState(false);
  const [prodReqModalOpen, setProdReqModalOpen] = useState(false);

  // ── Add Experience Form State ──
  const [expText, setExpText] = useState('');
  const [expFiles, setExpFiles] = useState([]);
  const [expPreviews, setExpPreviews] = useState([]);
  const [expIsAnonymous, setExpIsAnonymous] = useState(false);
  const [commentAnonMap, setCommentAnonMap] = useState({});
  const [expSubmitting, setExpSubmitting] = useState(false);
  const [expError, setExpError] = useState('');
  const [expSuccess, setExpSuccess] = useState(false);
  const expFileInputRef = useRef(null);

  // ── Product Availability Request Form State ──
  const [reqProductName, setReqProductName] = useState('');
  const [reqSpecifications, setReqSpecifications] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqFile, setReqFile] = useState(null);
  const [reqPreview, setReqPreview] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccessData, setReqSuccessData] = useState(null);
  const reqFileInputRef = useRef(null);

  // Load published experiences from DB
  const loadExperiences = async () => {
    setLoadingExperiences(true);
    try {
      const list = await fetchPublishedExperiences();
      setExperiences(list);
    } catch (err) {
      console.error('Failed to load student experiences:', err);
    } finally {
      setLoadingExperiences(false);
    }
  };

  useEffect(() => {
    loadExperiences();
  }, []);

  // Restore saved product request draft from sessionStorage
  useEffect(() => {
    try {
      const rawDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed.productName) setReqProductName(parsed.productName);
        if (parsed.specifications) setReqSpecifications(parsed.specifications);
        if (parsed.phone) setReqPhone(parsed.phone);
        if (parsed.notes) setReqNotes(parsed.notes);
      }
    } catch (_) {}

    // Restore saved student experience draft if any
    try {
      const savedExpDraft = sessionStorage.getItem('ad_experience_draft_text');
      if (savedExpDraft) setExpText(savedExpDraft);
      const savedExpAnon = sessionStorage.getItem('ad_experience_draft_anon');
      if (savedExpAnon !== null) setExpIsAnonymous(savedExpAnon === 'true');
    } catch (_) {}
  }, []);

  // Auto-fill contact phone from user account when logged in (if not already edited in draft)
  useEffect(() => {
    if (isLoggedInStudent) {
      const accountPhone = profile?.phone || user?.user_metadata?.phone || '';
      if (accountPhone && !reqPhone) {
        setReqPhone(accountPhone);
      }
    }
  }, [isLoggedInStudent, profile, user]);

  // Resume intended action after returning from Sign In / Sign Up
  useEffect(() => {
    if (isLoggedInStudent) {
      const pendingAction = sessionStorage.getItem(POST_AUTH_ACTION_KEY);
      if (pendingAction) {
        sessionStorage.removeItem(POST_AUTH_ACTION_KEY);
        if (pendingAction === 'open_add_experience') {
          // Restore saved experience draft text
          try {
            const savedExpDraft = sessionStorage.getItem('ad_experience_draft_text');
            if (savedExpDraft) setExpText(savedExpDraft);
            const savedExpAnon = sessionStorage.getItem('ad_experience_draft_anon');
            if (savedExpAnon !== null) setExpIsAnonymous(savedExpAnon === 'true');
          } catch (_) {}
          setAddExpModalOpen(true);
        } else if (pendingAction === 'open_product_request') {
          setProdReqModalOpen(true);
        }
      }
    }
  }, [isLoggedInStudent]);

  // Persist Product Request draft in sessionStorage so guest data is never lost
  const saveRequestDraft = (updates = {}) => {
    try {
      const nextDraft = {
        productName: updates.productName !== undefined ? updates.productName : reqProductName,
        specifications: updates.specifications !== undefined ? updates.specifications : reqSpecifications,
        phone: updates.phone !== undefined ? updates.phone : reqPhone,
        notes: updates.notes !== undefined ? updates.notes : reqNotes
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDraft));
    } catch (_) {}
  };

  // Trigger Auth Required Modal for Guest Actions
  const requireStudentAuth = (actionKey, reasonAr = '') => {
    if (isLoggedInStudent) return true;
    if (actionKey) {
      sessionStorage.setItem(POST_AUTH_ACTION_KEY, actionKey);
    }
    sessionStorage.setItem('ad_auth_return_url', '/');
    setAuthPromptReason(reasonAr);
    setAuthPromptOpen(true);
    return false;
  };

  // ── Handlers: Add Student Experience ──
  const handleOpenAddExperience = () => {
    if (!requireStudentAuth('open_add_experience')) return;
    setExpError('');
    setExpSuccess(false);
    setAddExpModalOpen(true);
  };

  const handleExpFilesChange = (e) => {
    setExpError('');
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const validFiles = [];
    const newPreviews = [];

    for (const file of selected) {
      const check = validateImageFile(file);
      if (!check.valid) {
        setExpError(check.error);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setExpFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    setExpPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const handleRemoveExpFile = (index) => {
    setExpFiles((prev) => prev.filter((_, i) => i !== index));
    setExpPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitExperience = async (e) => {
    e.preventDefault();
    if (!isLoggedInStudent) {
      try {
        sessionStorage.setItem('ad_experience_draft_text', expText);
        sessionStorage.setItem('ad_experience_draft_anon', String(expIsAnonymous));
      } catch (_) {}
      requireStudentAuth('open_add_experience');
      return;
    }
    setExpError('');

    const hasText = Boolean(expText.trim());
    const hasImages = Boolean(expFiles && expFiles.length > 0);
    if (!hasText && !hasImages) {
      setExpError('يرجى كتابة نص التجربة أو إرفاق صورة واحدة على الأقل.');
      return;
    }

    setExpSubmitting(true);
    try {
      const created = await submitStudentExperience({
        user,
        profile,
        text: expText,
        imageFiles: expFiles,
        isAnonymous: expIsAnonymous
      });
      if (created) {
        setExperiences((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
      }
      setExpSuccess(true);
      setExpText('');
      setExpFiles([]);
      setExpPreviews([]);
      try {
        sessionStorage.removeItem('ad_experience_draft_text');
        sessionStorage.removeItem('ad_experience_draft_anon');
      } catch (_) {}
    } catch (err) {
      setExpError(err.message || 'حدث خطأ أثناء إرسال التجربة، يرجى المحاولة مرة أخرى.');
    } finally {
      setExpSubmitting(false);
    }
  };

  // ── Handlers: Like & Comment on Experience ──
  const handleToggleLike = async (expId) => {
    if (!requireStudentAuth('like_experience')) return;
    if (likeBusyId === expId) return;

    setLikeBusyId(expId);
    try {
      const updated = await toggleExperienceLike({ experienceId: expId, userId: user.id });
      setExperiences((prev) => prev.map((item) => (item.id === expId ? updated : item)));
    } catch (err) {
      console.error('Like toggle error:', err);
    } finally {
      setLikeBusyId(null);
    }
  };

  const handleCommentSubmit = async (e, expId) => {
    e.preventDefault();
    if (!requireStudentAuth('comment_experience')) return;

    const text = (commentInputs[expId] || '').trim();
    if (!text) return;

    setCommentSubmittingId(expId);
    try {
      const isAnon = Boolean(commentAnonMap[expId]);
      const updated = await addExperienceComment({
        experienceId: expId,
        user,
        profile,
        commentText: text,
        isAnonymous: isAnon
      });
      setExperiences((prev) => prev.map((item) => (item.id === expId ? updated : item)));
      setCommentInputs((prev) => ({ ...prev, [expId]: '' }));
      setExpandedComments((prev) => ({ ...prev, [expId]: true }));
    } catch (err) {
      console.error('Comment submit error:', err);
    } finally {
      setCommentSubmittingId(null);
    }
  };

  // ── Handlers: Product Availability Request ──
  const handleOpenProductRequest = () => {
    setReqError('');
    setReqSuccessData(null);
    if (isLoggedInStudent && !reqPhone) {
      const savedPhone = profile?.phone || user?.user_metadata?.phone || '';
      if (savedPhone) setReqPhone(savedPhone);
    }
    setProdReqModalOpen(true);
  };

  const handleReqFileChange = (e) => {
    setReqError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.valid) {
      setReqError(check.error);
      return;
    }
    setReqFile(file);
    setReqPreview(URL.createObjectURL(file));
  };

  const handleSubmitProductRequest = async (e) => {
    e.preventDefault();
    setReqError('');

    if (!reqProductName.trim()) {
      setReqError('يرجى إدخال اسم المنتج المطلوب.');
      return;
    }
    if (!reqPhone.trim()) {
      setReqError('يرجى إدخال رقم التواصل.');
      return;
    }

    // Save draft before checking auth so guest never loses typed data
    saveRequestDraft();

    if (!isLoggedInStudent) {
      setProdReqModalOpen(false);
      requireStudentAuth('open_product_request');
      return;
    }

    setReqSubmitting(true);
    try {
      const created = await submitProductAvailabilityRequest({
        user,
        profile,
        productName: reqProductName,
        specifications: reqSpecifications,
        contactPhone: reqPhone,
        additionalNotes: reqNotes,
        imageFile: reqFile
      });
      setReqSuccessData(created);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setReqProductName('');
      setReqSpecifications('');
      setReqNotes('');
      setReqFile(null);
      setReqPreview('');
    } catch (err) {
      setReqError(err.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setReqSubmitting(false);
    }
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="home-redesign-page">
      {/* ── 1. HERO BACKGROUND & MAIN TWO GATEWAY CARDS ── */}
      <div className="home-hero-backdrop-wrap">
        <div className="home-hero-bg-layer" aria-hidden="true">
          <picture>
            <source srcSet={homeHeroBgWebp} type="image/webp" />
            <img src={homeHeroBgPng} alt="" className="home-hero-bg-img" />
          </picture>
          <div className="home-hero-bg-fade" />
        </div>

        <div className="container home-gateway-container">
          {/* Hero Heading */}
          <section className="home-hero" aria-labelledby="hero-question">
            <h1 id="hero-question" className="home-hero-title">
              {lang === 'ar' ? 'شن تبي تجهّز؟' : 'What are you preparing for?'}
            </h1>
            <p className="home-hero-subtitle">
              {lang === 'ar' ? 'اختر القسم المناسب لاحتياجاتك.' : 'Choose the section that suits your needs.'}
            </p>
          </section>

          {/* Two Main Gateway Cards */}
          <section className="home-gateway-grid" aria-label="Main Sections">
            {/* CARD 01: أدوات الدراسة */}
            <Link
              to="/study-tools"
              className="gateway-card gateway-card-reference"
              aria-label={lang === 'ar' ? 'أدوات الدراسة - كل مستلزمات الدراسة في مكان واحد' : 'Study Tools'}
            >
              <div className="gateway-card-content">
                <div className="gateway-card-text">
                  <h2 className="gateway-card-title">
                    {lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
                  </h2>
                  <p className="gateway-card-desc">
                    {lang === 'ar'
                      ? 'كل مستلزمات الدراسة في مكان واحد.'
                      : 'All your dental study instruments and supplies in one place.'}
                  </p>
                </div>

                <div className="gateway-card-action">
                  <span className="gateway-pill-cta">
                    <span>{lang === 'ar' ? 'ابدأ الآن' : 'Start Now'}</span>
                    <ArrowIcon size={16} strokeWidth={2.5} />
                  </span>
                </div>
              </div>

              <div className="gateway-card-artwork">
                <picture>
                  <source srcSet={studyToolsWebp} type="image/webp" />
                  <img
                    src={studyToolsPng}
                    alt={lang === 'ar' ? 'أدوات الدراسة' : 'Study Tools'}
                    loading="eager"
                    className="gateway-art-img"
                  />
                </picture>
              </div>
            </Link>

            {/* CARD 02: إكسسوارات الأسنان */}
            <Link
              to="/accessories"
              className="gateway-card gateway-card-reference"
              aria-label={lang === 'ar' ? 'إكسسوارات الأسنان - بوكسات، حقائب، أدوات تنظيم ومستلزمات إضافية' : 'Dental Accessories'}
            >
              <div className="gateway-card-content">
                <div className="gateway-card-text">
                  <h2 className="gateway-card-title">
                    {lang === 'ar' ? 'إكسسوارات الأسنان' : 'Dental Accessories'}
                  </h2>
                  <p className="gateway-card-desc">
                    {lang === 'ar'
                      ? 'بوكسات، حقائب، أدوات تنظيم ومستلزمات إضافية.'
                      : 'Boxes, bags, organization gear and extra student supplies.'}
                  </p>
                </div>

                <div className="gateway-card-action">
                  <span className="gateway-pill-cta">
                    <span>{lang === 'ar' ? 'تصفح الآن' : 'Browse Now'}</span>
                    <ArrowIcon size={16} strokeWidth={2.5} />
                  </span>
                </div>
              </div>

              <div className="gateway-card-artwork">
                <picture>
                  <source srcSet={dentalBoxesWebp} type="image/webp" />
                  <img
                    src={dentalBoxesPng}
                    alt={lang === 'ar' ? 'إكسسوارات الأسنان' : 'Dental Accessories'}
                    loading="eager"
                    className="gateway-art-img"
                  />
                </picture>
              </div>
            </Link>
          </section>
        </div>
      </div>

      {/* ── 2. STUDENT EXPERIENCES SECTION (تجارب الطلبة مع ابسلوت دنتال) ── */}
      <div className="container home-gateway-container">
        <section className="home-experiences-section" aria-labelledby="student-experiences-heading">
          {/* Decorative Section Header */}
          <div className="home-section-divider-header">
            <span className="home-divider-line" />
            <h2 id="student-experiences-heading" className="home-section-heading-text">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="home-tooth-icon">
                <path
                  d="M7 3C4.2 3 2.5 5.2 2.5 8.2C2.5 10.6 3.7 12.6 4.5 14.8C5.3 17 5.8 21 7.8 21C9.3 21 9.8 17.5 12 17.5C14.2 17.5 14.7 21 16.2 21C18.2 21 18.7 17 19.5 14.8C20.3 12.6 21.5 10.6 21.5 8.2C21.5 5.2 19.8 3 17 3C15.2 3 13.8 4 12 4C10.2 4 8.8 3 7 3Z"
                  fill="#FFFDF9"
                  stroke="#684835"
                  strokeWidth="1.8"
                />
              </svg>
              <span>{lang === 'ar' ? 'تجارب الطلبة مع ابسلوت دنتال' : 'Student Experiences with Absolute Dental'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="home-tooth-icon-sm">
                <path
                  d="M7 3C4.2 3 2.5 5.2 2.5 8.2C2.5 10.6 3.7 12.6 4.5 14.8C5.3 17 5.8 21 7.8 21C9.3 21 9.8 17.5 12 17.5C14.2 17.5 14.7 21 16.2 21C18.2 21 18.7 17 19.5 14.8C20.3 12.6 21.5 10.6 21.5 8.2C21.5 5.2 19.8 3 17 3C15.2 3 13.8 4 12 4C10.2 4 8.8 3 7 3Z"
                  fill="#EADBC8"
                  stroke="#8C6D53"
                  strokeWidth="1.6"
                />
              </svg>
            </h2>
            <span className="home-divider-line" />
          </div>

          {/* Empty State vs Published Experiences */}
          {loadingExperiences ? (
            <div className="home-experiences-empty-card" style={{ opacity: 0.7 }}>
              <p style={{ color: '#7A6E65', fontWeight: 700 }}>
                {lang === 'ar' ? 'جاري تحميل تجارب الطلبة...' : 'Loading student experiences...'}
              </p>
            </div>
          ) : experiences.length === 0 ? (
            /* Default Empty State Card matching reference image */
            <div className="home-experiences-empty-card">
              {/* Camera + Chat Bubble Illustration */}
              <div className="home-empty-exp-illustration" aria-hidden="true">
                <svg width="150" height="105" viewBox="0 0 160 112" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Soft Ground Shadow */}
                  <ellipse cx="80" cy="98" rx="56" ry="8" fill="#E8DCCB" fillOpacity="0.65" />
                  {/* Sparkle Dots */}
                  <circle cx="30" cy="34" r="2.5" fill="#D4A853" opacity="0.6" />
                  <circle cx="132" cy="28" r="2" fill="#D4A853" opacity="0.5" />
                  <path d="M22 52L24 56L28 58L24 60L22 64L20 60L16 58L20 56L22 52Z" fill="#D4A853" opacity="0.65" />
                  <path d="M138 56L139.5 59L142.5 60.5L139.5 62L138 65L136.5 62L133.5 60.5L136.5 59L138 56Z" fill="#C49A45" opacity="0.55" />

                  {/* Camera Body */}
                  <rect x="34" y="38" width="66" height="48" rx="11" fill="#E6D5C0" stroke="#7A5A44" strokeWidth="2.2" />
                  <path d="M48 38L53 29H75L80 38H48Z" fill="#D5C0A7" stroke="#7A5A44" strokeWidth="2.2" strokeLinejoin="round" />
                  <rect x="42" y="45" width="9" height="5" rx="2.5" fill="#FFFDF9" />
                  {/* Camera Lens */}
                  <circle cx="67" cy="63" r="15" fill="#FFFDF9" stroke="#7A5A44" strokeWidth="2.2" />
                  <circle cx="67" cy="63" r="10" fill="#B6957A" stroke="#7A5A44" strokeWidth="1.8" />
                  <circle cx="64" cy="60" r="3" fill="#FFFDF9" />

                  {/* Speech Bubble with Stars & Heart */}
                  <path
                    d="M84 22C84 15.9249 88.9249 11 95 11H125C131.075 11 136 15.9249 136 22V40C136 46.0751 131.075 51 125 51H103L91 59V51H95C88.9249 51 84 46.0751 84 40V22Z"
                    fill="#FFFDF9"
                    stroke="#7A5A44"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                  {/* 3 Gold Stars inside Bubble */}
                  <path d="M97 25L98.8 28.6L102.8 29.2L99.9 32L100.6 36L97 34.1L93.4 36L94.1 32L91.2 29.2L95.2 28.6L97 25Z" fill="#E0A84B" />
                  <path d="M110 23L111.8 26.6L115.8 27.2L112.9 30L113.6 34L110 32.1L106.4 34L107.1 30L104.2 27.2L108.2 26.6L110 23Z" fill="#E0A84B" />
                  <path d="M123 25L124.8 28.6L128.8 29.2L125.9 32L126.6 36L123 34.1L119.4 36L120.1 32L117.2 29.2L121.2 28.6L123 25Z" fill="#E0A84B" />

                  {/* Warm Heart Badge */}
                  <circle cx="106" cy="70" r="12" fill="#FFFDF9" stroke="#7A5A44" strokeWidth="2" />
                  <path
                    d="M106 75.8C106 75.8 99.5 71.6 99.5 67.3C99.5 65.1 101.2 63.5 103.2 63.5C104.5 63.5 105.5 64.2 106 65.1C106.5 64.2 107.5 63.5 108.8 63.5C110.8 63.5 112.5 65.1 112.5 67.3C112.5 71.6 106 75.8 106 75.8Z"
                    fill="#D9796C"
                  />
                </svg>
              </div>

              <h3 className="home-empty-exp-title">
                {lang === 'ar' ? 'ما زالت ما فيش تجارب منشورة.' : 'No experiences published yet.'}
              </h3>
              <p className="home-empty-exp-subtitle">
                {lang === 'ar'
                  ? 'كون أول من يشارك تجربته مع Absolute Dental.'
                  : 'Be the first to share your experience with Absolute Dental.'}
              </p>

              <button
                type="button"
                onClick={handleOpenAddExperience}
                className="home-primary-pill-btn"
              >
                <Plus size={17} strokeWidth={2.8} />
                <span>{lang === 'ar' ? 'أضف تجربتك' : 'Add Your Experience'}</span>
              </button>
            </div>
          ) : (
            /* Published Experiences Feed */
            <div className="home-experiences-feed-wrap">
              <div className="home-experiences-feed-toolbar">
                <p style={{ margin: 0, color: '#6E5D50', fontWeight: 700, fontSize: '0.92rem' }}>
                  {lang === 'ar'
                    ? `تجارب الطلبة مع ابسلوت دنتال (${experiences.length})`
                    : `Student Experiences with Absolute Dental (${experiences.length})`}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddExperience}
                  className="home-primary-pill-btn"
                >
                  <Plus size={16} strokeWidth={2.8} />
                  <span>{lang === 'ar' ? 'أضف تجربتك' : 'Add Your Experience'}</span>
                </button>
              </div>

              <div className="home-experiences-grid">
                {experiences.map((exp) => {
                  const likesArr = Array.isArray(exp.likes) ? exp.likes : [];
                  const isLikedByMe = Boolean(user && likesArr.includes(user.id));
                  const commentsArr = Array.isArray(exp.comments) ? exp.comments : [];
                  const isCommentsOpen = Boolean(expandedComments[exp.id]);

                  return (
                    <article key={exp.id} className="home-exp-card">
                      {/* Author & Date Header */}
                      <div className="home-exp-card-header">
                        {exp.is_anonymous ? (
                          <div
                            className="home-exp-avatar"
                            style={{
                              backgroundColor: '#EFEBE4',
                              color: '#6E6258',
                              border: '1.5px solid #D6CBC1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={lang === 'ar' ? 'طالب مجهول الهوية' : 'Anonymous Student'}
                          >
                            <EyeOff size={18} strokeWidth={2.2} />
                          </div>
                        ) : (
                          <div className="home-exp-avatar">
                            {exp.avatar_url ? (
                              <img src={exp.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              (exp.user_name || 'ط')[0]
                            )}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="home-exp-author-name" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span>{exp.is_anonymous ? (lang === 'ar' ? 'طالب مجهول الهوية' : 'Anonymous Student') : (exp.user_name || 'طالب طب أسنان')}</span>
                            {exp.is_anonymous ? (
                              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem', borderRadius: '999px', backgroundColor: '#F0ECE6', color: '#6E6258', fontWeight: 700, border: '1px solid #DFD7CC' }}>
                                🔒 {lang === 'ar' ? 'مجهول الهوية' : 'Anonymous'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem', borderRadius: '999px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)' }}>
                                ✓ {lang === 'ar' ? 'طالب معتمد' : 'Verified'}
                              </span>
                            )}
                          </div>
                          <div className="home-exp-meta">
                            <span>{exp.university || 'كلية طب الأسنان'}</span>
                            <span>•</span>
                            <span>
                              {exp.published_at || exp.created_at
                                ? new Date(exp.published_at || exp.created_at).toLocaleDateString('ar-LY', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Experience Text */}
                      {exp.text && <p className="home-exp-text">{exp.text}</p>}

                      {/* Experience Images */}
                      {Array.isArray(exp.images) && exp.images.length > 0 && (
                        <div className={`home-exp-images-grid count-${Math.min(exp.images.length, 3)}`}>
                          {exp.images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="home-exp-img-btn"
                              onClick={() => setLightboxImage(imgUrl)}
                              aria-label="عرض الصورة بحجم كامل"
                            >
                              <img src={imgUrl} alt={`تجربة ${exp.user_name}`} loading="lazy" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Interaction Bar: Likes & Comments */}
                      <div className="home-exp-actions-bar">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(exp.id)}
                          disabled={likeBusyId === exp.id}
                          className={`home-exp-action-btn ${isLikedByMe ? 'liked' : ''}`}
                        >
                          <Heart size={16} fill={isLikedByMe ? '#DC2626' : 'none'} strokeWidth={2.2} />
                          <span>{likesArr.length}</span>
                          <span>{lang === 'ar' ? 'إعجاب' : 'Like'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComments((prev) => ({ ...prev, [exp.id]: !prev[exp.id] }))
                          }
                          className="home-exp-action-btn"
                        >
                          <MessageCircle size={16} strokeWidth={2.2} />
                          <span>{commentsArr.length}</span>
                          <span>{lang === 'ar' ? 'تعليق' : 'Comment'}</span>
                        </button>
                      </div>

                      {/* Expandable Comments Section */}
                      {isCommentsOpen && (
                        <div className="home-exp-comments-box">
                          {commentsArr.length > 0 ? (
                            <div className="home-exp-comments-list">
                              {commentsArr.map((c) => (
                                <div key={c.id} className="home-exp-comment-item">
                                  <div className="home-exp-comment-head">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      {c.is_anonymous ? (
                                        <>
                                          <EyeOff size={13} style={{ color: '#8A7B6E' }} />
                                          <strong style={{ color: '#6E6258' }}>{lang === 'ar' ? 'طالب مجهول' : 'Anonymous Student'}</strong>
                                        </>
                                      ) : (
                                        <strong>{c.user_name}</strong>
                                      )}
                                    </div>
                                    <span>
                                      {c.created_at
                                        ? new Date(c.created_at).toLocaleDateString('ar-LY', {
                                            month: 'short',
                                            day: 'numeric'
                                          })
                                        : ''}
                                    </span>
                                  </div>
                                  <p>{c.text}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="home-exp-no-comments">
                              {lang === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يعلق!' : 'No comments yet.'}
                            </p>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.2rem 0.4rem 0.4rem', fontSize: '0.74rem' }}>
                            <button
                              type="button"
                              onClick={() => setCommentAnonMap((prev) => ({ ...prev, [exp.id]: !prev[exp.id] }))}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: commentAnonMap[exp.id] ? '#684835' : '#8A7B6E',
                                fontWeight: commentAnonMap[exp.id] ? 800 : 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: 0
                              }}
                            >
                              {commentAnonMap[exp.id] ? <EyeOff size={13} /> : <UserCheck size={13} />}
                              <span>{commentAnonMap[exp.id] ? (lang === 'ar' ? '🔒 تعليق بمجهول الهوية' : 'Anonymous comment') : (lang === 'ar' ? '👤 تعليق باسمي الشخصي' : 'Real name comment')}</span>
                            </button>
                          </div>

                          <form onSubmit={(e) => handleCommentSubmit(e, exp.id)} className="home-exp-comment-form">
                            <input
                              type="text"
                              value={commentInputs[exp.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [exp.id]: e.target.value }))
                              }
                              onFocus={() => {
                                if (!isLoggedInStudent) {
                                  requireStudentAuth('comment_experience');
                                }
                              }}
                              placeholder={commentAnonMap[exp.id] ? (lang === 'ar' ? 'اكتب تعليقك بمجهول الهوية...' : 'Write an anonymous comment...') : (lang === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...')}
                              className="home-exp-comment-input"
                            />
                            <button
                              type="submit"
                              disabled={commentSubmittingId === exp.id}
                              className="home-exp-comment-send"
                              aria-label="إرسال التعليق"
                            >
                              <Send size={14} />
                            </button>
                          </form>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── 3. PRODUCT AVAILABILITY REQUEST SECTION (قسم طلب توفير منتج) ── */}
        <section className="home-product-request-section" aria-labelledby="product-request-heading">
          <div className="home-product-request-banner">
            <div className="home-product-request-content">
              <div className="home-product-request-title-row">
                <Sparkles size={22} className="home-product-request-star" />
                <h2 id="product-request-heading" className="home-product-request-title">
                  {lang === 'ar' ? 'مش لاقي اللي تبيه؟ خلّيه علينا!' : "Can't find what you need? Leave it to us!"}
                </h2>
              </div>

              <p className="home-product-request-desc">
                {lang === 'ar'
                  ? 'لو فيه أداة أو منتج تحتاجه ومش موجود عندنا، ابعتلنا طلبك وحنراجعوا إمكانية توفيره.'
                  : 'If there is a dental tool or product you need that is not listed, send us a request and we will review sourcing it for you.'}
              </p>

              <div className="home-product-request-action">
                <button
                  type="button"
                  onClick={handleOpenProductRequest}
                  className="home-primary-pill-btn home-request-cta-btn"
                >
                  <span>{lang === 'ar' ? 'اطلب منتجك الآن' : 'Request Your Product Now'}</span>
                  <ArrowIcon size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="home-product-request-artwork" aria-hidden="true">
              <picture>
                <source srcSet={productRequestWebp} type="image/webp" />
                <img
                  src={productRequestPng}
                  alt=""
                  loading="lazy"
                  className="home-product-request-img"
                />
              </picture>
            </div>
          </div>
        </section>
      </div>

      {/* ── MODAL 1: AUTH REQUIRED PROMPT FOR GUESTS ── */}
      {authPromptOpen &&
        createPortal(
          <div className="ad-modal-backdrop" onClick={() => setAuthPromptOpen(false)}>
            <div
              className="ad-modal-dialog ad-auth-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="ad-modal-close"
                onClick={() => setAuthPromptOpen(false)}
                aria-label="إغلاق"
              >
                <X size={19} />
              </button>

              <div className="ad-auth-modal-icon">
                <Lock size={26} />
              </div>

              <h3 className="ad-modal-title" style={{ textAlign: 'center' }}>
                هذه الميزة متاحة للمستخدمين المسجلين فقط.
              </h3>

              <p className="ad-modal-subtitle" style={{ textAlign: 'center' }}>
                {authPromptReason ||
                  'يرجى تسجيل الدخول أو إنشاء حساب للمتابعة. سيتم إعادتك تلقائياً لإكمال العملية.'}
              </p>

              <div className="ad-auth-modal-actions">
                <button
                  type="button"
                  className="home-primary-pill-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setAuthPromptOpen(false);
                    navigate('/signin?redirect=/');
                  }}
                >
                  <User size={16} />
                  <span>تسجيل الدخول</span>
                </button>

                <button
                  type="button"
                  className="ad-secondary-pill-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setAuthPromptOpen(false);
                    navigate('/signin?tab=register&redirect=/');
                  }}
                >
                  <Plus size={16} />
                  <span>إنشاء حساب</span>
                </button>

                <button
                  type="button"
                  className="ad-google-pill-btn"
                  onClick={() => signInWithGoogle('/')}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
                    <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.6 6.4C.6 8.4 0 10.6 0 12s.6 3.6 1.6 5.6l3.7-2.8z"/>
                    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.7-2.9c-1 .7-2.2 1.1-3.6 1.1-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z"/>
                  </svg>
                  <span>المتابعة باستخدام Google</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 2: ADD STUDENT EXPERIENCE (إضافة تجربة جديدة) ── */}
      {addExpModalOpen &&
        createPortal(
          <div className="ad-modal-backdrop" onClick={() => setAddExpModalOpen(false)}>
            <div
              className="ad-modal-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="ad-modal-header">
                <div>
                  <h3 className="ad-modal-title">شارك تجربتك مع Absolute Dental</h3>
                  <p className="ad-modal-subtitle">
                    أرفق صوراً للأدوات أو طلبك واكتب رأيك ليستفيد زملاؤك الطلبة.
                  </p>
                </div>
                <button
                  type="button"
                  className="ad-modal-close"
                  onClick={() => setAddExpModalOpen(false)}
                  aria-label="إغلاق"
                >
                  <X size={19} />
                </button>
              </div>

              {expSuccess ? (
                <div className="ad-modal-success-box">
                  <CheckCircle2 size={46} style={{ color: '#059669', margin: '0 auto 0.75rem' }} />
                  <h4>تم نشر تجربتك بنجاح! ✨</h4>
                  <p>
                    شكراً لمشاركتك تجربتك معنا! تم نشر مشاركتك في قسم «تجارب الطلبة مع ابسلوت دنتال» وتظهر الآن مباشرة لجميع الزملاء.
                  </p>
                  <button
                    type="button"
                    className="home-primary-pill-btn"
                    style={{ marginTop: '1rem' }}
                    onClick={() => {
                      setExpSuccess(false);
                      setAddExpModalOpen(false);
                    }}
                  >
                    حسناً، إغلاق
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitExperience} className="ad-modal-form">
                  {expError && <div className="ad-modal-error">{expError}</div>}

                  {/* Image Upload Field */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">صور التجربة (اختياري)</label>
                    <input
                      ref={expFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleExpFilesChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => expFileInputRef.current?.click()}
                      className="ad-upload-dropzone"
                    >
                      <Camera size={24} style={{ color: '#684835' }} />
                      <span>اضغط لاختيار صورة أو أكثر (اختياري)</span>
                      <small>يمكنك إرفاق حتى 5 صور مع معاينتها قبل الإرسال</small>
                    </button>

                    {expPreviews.length > 0 && (
                      <div className="ad-upload-previews-row">
                        {expPreviews.map((src, idx) => (
                          <div key={idx} className="ad-upload-preview-item">
                            <img src={src} alt={`معاينة ${idx + 1}`} />
                            <button
                              type="button"
                              onClick={() => handleRemoveExpFile(idx)}
                              className="ad-upload-preview-remove"
                              aria-label="حذف الصورة"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Experience Text Field */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">نص التجربة (اختياري عند إرفاق صورة)</label>
                    <textarea
                      rows={4}
                      value={expText}
                      onChange={(e) => setExpText(e.target.value)}
                      placeholder="احكِ لزملائك عن تجربتك مع جودة الأدوات، التغليف، وسرعة التوصيل..."
                      className="form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Identity Selector: Real Name vs Anonymous */}
                  <div
                    style={{
                      backgroundColor: '#FAF7F2',
                      border: '1.5px solid #E6DDD2',
                      borderRadius: '16px',
                      padding: '0.9rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3E2B1D' }}>
                        {lang === 'ar' ? 'طريقة ظهور هويتك' : 'Publishing Identity'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#8A7B6E' }}>
                        {lang === 'ar' ? 'يمكنك الاختيار لكل مشاركة' : 'Choose per post'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => setExpIsAnonymous(false)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '12px',
                          border: !expIsAnonymous ? '2px solid #684835' : '1px solid #D6CBC1',
                          backgroundColor: !expIsAnonymous ? '#F5ECE1' : '#FFFFFF',
                          color: !expIsAnonymous ? '#3B2617' : '#6E6258',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: !expIsAnonymous ? 800 : 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <UserCheck size={16} style={{ color: !expIsAnonymous ? '#684835' : '#8C7E72' }} />
                        <span>{lang === 'ar' ? 'باسمي الحقيقي' : 'Real Name'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpIsAnonymous(true)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '12px',
                          border: expIsAnonymous ? '2px solid #684835' : '1px solid #D6CBC1',
                          backgroundColor: expIsAnonymous ? '#F5ECE1' : '#FFFFFF',
                          color: expIsAnonymous ? '#3B2617' : '#6E6258',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: expIsAnonymous ? 800 : 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <EyeOff size={16} style={{ color: expIsAnonymous ? '#684835' : '#8C7E72' }} />
                        <span>{lang === 'ar' ? 'مجهول الهوية' : 'Anonymous'}</span>
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#73665C', lineHeight: 1.4 }}>
                      {expIsAnonymous
                        ? (lang === 'ar' ? '🔒 سيتم نشر تجربتك تحت اسم «طالب مجهول الهوية» دون كشف اسمك أو صورتك الشخصية.' : '🔒 Your experience will be posted as "Anonymous Student" with your name & avatar hidden.')
                        : (lang === 'ar' ? `✨ ستظهر التجربة باسمك «${profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'طالب معتمد'}» وصورتك الشخصية الموثقة.` : '✨ Your verified student name and photo will be displayed.')
                      }
                    </p>
                  </div>

                  <div className="ad-modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setAddExpModalOpen(false)}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={expSubmitting}
                      className="home-primary-pill-btn"
                    >
                      <Send size={15} />
                      <span>{expSubmitting ? 'جاري الإرسال...' : 'إرسال للمراجعة'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 3: PRODUCT AVAILABILITY REQUEST (نموذج طلب توفير منتج) ── */}
      {prodReqModalOpen &&
        createPortal(
          <div className="ad-modal-backdrop" onClick={() => setProdReqModalOpen(false)}>
            <div
              className="ad-modal-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="ad-modal-header">
                <div>
                  <h3 className="ad-modal-title">طلب توفير أداة أو منتج</h3>
                  <p className="ad-modal-subtitle">
                    أدخل تفاصيل الأداة غير المتوفرة وسنقوم بمراجعة إمكانية توفيرها والتواصل معك.
                  </p>
                </div>
                <button
                  type="button"
                  className="ad-modal-close"
                  onClick={() => setProdReqModalOpen(false)}
                  aria-label="إغلاق"
                >
                  <X size={19} />
                </button>
              </div>

              {reqSuccessData ? (
                <div className="ad-modal-success-box">
                  <CheckCircle2 size={46} style={{ color: '#059669', margin: '0 auto 0.75rem' }} />
                  <h4>تم استلام طلب توفير المنتج بنجاح!</h4>
                  <div className="ad-req-number-badge">
                    رقم الطلب: <strong>{reqSuccessData.request_number}</strong>
                  </div>
                  <p>
                    تم تسجيل طلبك لتوفير <strong>«{reqSuccessData.product_name}»</strong>. سيقوم فريقنا بمراجعة الطلب والتواصل معك على الرقم المرفق.
                  </p>
                  <button
                    type="button"
                    className="home-primary-pill-btn"
                    style={{ marginTop: '1rem' }}
                    onClick={() => {
                      setReqSuccessData(null);
                      setProdReqModalOpen(false);
                    }}
                  >
                    حسناً، إغلاق
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitProductRequest} className="ad-modal-form">
                  {reqError && <div className="ad-modal-error">{reqError}</div>}

                  {/* 1. اسم المنتج (إجباري) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">اسم المنتج المطلوب *</label>
                    <input
                      type="text"
                      required
                      value={reqProductName}
                      onChange={(e) => {
                        setReqProductName(e.target.value);
                        saveRequestDraft({ productName: e.target.value });
                      }}
                      placeholder="مثال: Articulator Magnetic / أداة نحت خاصة..."
                      className="form-input"
                    />
                  </div>

                  {/* 2. صورة المنتج (اختياري) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">صورة المنتج (اختياري)</label>
                    <input
                      ref={reqFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleReqFileChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => reqFileInputRef.current?.click()}
                        className="ad-upload-inline-btn"
                      >
                        <ImageIcon size={17} />
                        <span>{reqPreview ? 'تغيير الصورة' : 'إرفاق صورة توضيحية'}</span>
                      </button>
                      {reqPreview && (
                        <div className="ad-upload-preview-item" style={{ width: 64, height: 64 }}>
                          <img src={reqPreview} alt="معاينة المنتج" />
                          <button
                            type="button"
                            onClick={() => {
                              setReqFile(null);
                              setReqPreview('');
                            }}
                            className="ad-upload-preview-remove"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. تفاصيل المنتج ومواصفاته (اختياري) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">تفاصيل المنتج ومواصفاته (اختياري)</label>
                    <textarea
                      rows={2}
                      value={reqSpecifications}
                      onChange={(e) => {
                        setReqSpecifications(e.target.value);
                        saveRequestDraft({ specifications: e.target.value });
                      }}
                      placeholder="المقاس، الشركة المصنعة، الموديل، المادة الدراسية، أو الاستخدام..."
                      className="form-input"
                    />
                  </div>

                  {/* 4. رقم التواصل (إجباري - يعبأ تلقائياً وقابل للتعديل لهذا الطلب فقط) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">رقم التواصل (هاتف / واتساب) *</label>
                    <input
                      type="tel"
                      required
                      value={reqPhone}
                      onChange={(e) => {
                        setReqPhone(e.target.value);
                        saveRequestDraft({ phone: e.target.value });
                      }}
                      placeholder="09XXXXXXXX"
                      className="form-input"
                    />
                    <small style={{ color: '#7A6E65', fontSize: '0.74rem', marginTop: '0.2rem', display: 'block' }}>
                      يمكنك تعديل الرقم لهذا الطلب دون تغيير الرقم المحفوظ في حسابك.
                    </small>
                  </div>

                  {/* 5. ملاحظات إضافية (اختياري) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ملاحظات إضافية (اختياري)</label>
                    <textarea
                      rows={2}
                      value={reqNotes}
                      onChange={(e) => {
                        setReqNotes(e.target.value);
                        saveRequestDraft({ notes: e.target.value });
                      }}
                      placeholder="الكمية المطلوبة أو أي ملاحظة أخرى..."
                      className="form-input"
                    />
                  </div>

                  <div className="ad-modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setProdReqModalOpen(false)}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={reqSubmitting}
                      className="home-primary-pill-btn"
                    >
                      <Send size={15} />
                      <span>{reqSubmitting ? 'جاري إرسال الطلب...' : 'إرسال الطلب'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ── LIGHTBOX MODAL FOR EXPERIENCE PHOTOS ── */}
      {lightboxImage &&
        createPortal(
          <div className="ad-modal-backdrop" onClick={() => setLightboxImage(null)}>
            <div
              style={{ position: 'relative', maxWidth: '92vw', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="ad-modal-close"
                style={{ position: 'absolute', top: '-14px', insetInlineEnd: '-14px', background: '#fff' }}
              >
                <X size={20} />
              </button>
              <img
                src={lightboxImage}
                alt="صورة التجربة"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '85vh',
                  borderRadius: '16px',
                  objectFit: 'contain',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Home;
