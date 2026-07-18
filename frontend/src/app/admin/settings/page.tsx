"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Save, Globe, Mail, Info } from "lucide-react";
import toast from "react-hot-toast";
import { settingsAPI } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SiteSettings {
  id: string;
  siteName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  faviconUrl: string;
  faviconPublicId: string;
  logoUrl: string;
  logoPublicId: string;
  smtpHost: string;
  smtpPort: number | string;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  resendApiKey: string;
  orderEmailSubject: string;
  orderEmailTemplate: string;
  aboutTitle: string;
  aboutContent: string;
  aboutImage: string;
}

type ActiveTab = "general" | "email" | "about";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-cream-50 border border-cream-200 text-charcoal-900 text-sm px-3 py-2.5 focus:outline-none focus:border-gold-400 rounded";

const labelClass =
  "block text-xs text-charcoal-600 mb-1.5 uppercase tracking-wide font-medium";

const cardClass = "bg-white border border-charcoal-100 p-6 space-y-5 rounded";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-24 bg-cream-200 rounded animate-pulse" />
      <div className="h-10 w-full bg-cream-100 rounded animate-pulse" />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className={cardClass}>
      {[...Array(5)].map((_, i) => (
        <SkeletonRow key={i} />
      ))}
      <div className="h-10 w-28 bg-cream-200 rounded animate-pulse" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Upload Widget
// ─────────────────────────────────────────────────────────────────────────────

interface ImageUploadProps {
  label: string;
  currentUrl: string;
  onUpload: (fd: FormData) => Promise<void>;
  uploading: boolean;
  previewSize?: "sm" | "md";
}

function ImageUpload({
  label,
  currentUrl,
  onUpload,
  uploading,
  previewSize = "md",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string>("");

  const previewDim =
    previewSize === "sm"
      ? "h-10 w-10 rounded"
      : "h-24 w-24 rounded object-contain";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setLocalPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append("file", file);
    await onUpload(fd);

    // reset so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayUrl = localPreview || currentUrl;

  return (
    <div className="flex items-center gap-4">
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt={label}
          className={`border border-cream-200 object-contain bg-cream-50 ${previewDim}`}
        />
      ) : (
        <div
          className={`border border-dashed border-cream-300 bg-cream-50 flex items-center justify-center ${previewDim}`}
        >
          <Upload className="h-4 w-4 text-charcoal-400" />
        </div>
      )}

      <div>
        <p className={labelClass}>{label}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 border border-cream-300 text-charcoal-700 bg-cream-50 hover:border-gold-400 hover:text-gold-600 transition-colors rounded disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false);

  const [form, setForm] = useState<SiteSettings>({
    id: "",
    siteName: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    faviconUrl: "",
    faviconPublicId: "",
    logoUrl: "",
    logoPublicId: "",
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    resendApiKey: "",
    orderEmailSubject: "",
    orderEmailTemplate: "",
    aboutTitle: "",
    aboutContent: "",
    aboutImage: "",
  });

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getAdmin();
      const s = res.data.settings;
      setForm({
        id: s.id ?? "",
        siteName: s.siteName ?? "",
        metaTitle: s.metaTitle ?? "",
        metaDescription: s.metaDescription ?? "",
        metaKeywords: s.metaKeywords ?? "",
        faviconUrl: s.faviconUrl ?? "",
        faviconPublicId: s.faviconPublicId ?? "",
        logoUrl: s.logoUrl ?? "",
        logoPublicId: s.logoPublicId ?? "",
        smtpHost: s.smtpHost ?? "",
        smtpPort: s.smtpPort ?? "",
        smtpUser: s.smtpUser ?? "",
        smtpPass: s.smtpPass ?? "",
        smtpFrom: s.smtpFrom ?? "",
        resendApiKey: s.resendApiKey ?? "",
        orderEmailSubject: s.orderEmailSubject ?? "",
        orderEmailTemplate: s.orderEmailTemplate ?? "",
        aboutTitle: s.aboutTitle ?? "",
        aboutContent: s.aboutContent ?? "",
        aboutImage: s.aboutImage ?? "",
      });
    } catch {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── Field change ─────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Save text fields ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.update(form);
      toast.success("Settings saved successfully.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // ── Image uploads ────────────────────────────────────────────────────────────

  const handleFaviconUpload = async (fd: FormData) => {
    setUploadingFavicon(true);
    try {
      const res = await settingsAPI.uploadFavicon(fd);
      setForm((prev) => ({
        ...prev,
        faviconUrl: res.data?.settings?.faviconUrl ?? prev.faviconUrl,
      }));
      toast.success("Favicon updated.");
    } catch {
      toast.error("Favicon upload failed.");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleLogoUpload = async (fd: FormData) => {
    setUploadingLogo(true);
    try {
      const res = await settingsAPI.uploadLogo(fd);
      setForm((prev) => ({
        ...prev,
        logoUrl: res.data?.settings?.logoUrl ?? prev.logoUrl,
      }));
      toast.success("Logo updated.");
    } catch {
      toast.error("Logo upload failed.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAboutImageUpload = async (fd: FormData) => {
    setUploadingAboutImage(true);
    try {
      const res = await settingsAPI.uploadAboutImage(fd);
      setForm((prev) => ({
        ...prev,
        aboutImage: res.data?.settings?.aboutImage ?? prev.aboutImage,
      }));
      toast.success("About image updated.");
    } catch {
      toast.error("About image upload failed.");
    } finally {
      setUploadingAboutImage(false);
    }
  };

  // ── Tab config ───────────────────────────────────────────────────────────────

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "general",
      label: "General",
      icon: <Globe className="h-3.5 w-3.5" />,
    },
    {
      id: "email",
      label: "Email (Resend)",
      icon: <Mail className="h-3.5 w-3.5" />,
    },
    {
      id: "about",
      label: "About Us",
      icon: <Info className="h-3.5 w-3.5" />,
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-charcoal-900 tracking-tight">
            Site Settings
          </h1>
          <p className="mt-1 text-sm text-charcoal-500">
            Manage global settings for your ShreeJewels storefront.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === tab.id
                  ? "bg-gold-500 text-white shadow-sm"
                  : "text-charcoal-600 bg-cream-50 border border-cream-200 hover:border-gold-300 hover:text-charcoal-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <SettingsSkeleton />
        ) : (
          <>
            {/* ── General Tab ──────────────────────────────────────────────── */}
            {activeTab === "general" && (
              <div className={cardClass}>
                {/* Site Name */}
                <div>
                  <label className={labelClass} htmlFor="siteName">
                    Site Name
                  </label>
                  <input
                    id="siteName"
                    name="siteName"
                    type="text"
                    value={form.siteName}
                    onChange={handleChange}
                    placeholder="ShreeJewels"
                    className={inputClass}
                  />
                </div>

                {/* Meta Title */}
                <div>
                  <label className={labelClass} htmlFor="metaTitle">
                    Global Meta Title
                  </label>
                  <input
                    id="metaTitle"
                    name="metaTitle"
                    type="text"
                    value={form.metaTitle}
                    onChange={handleChange}
                    placeholder="ShreeJewels — Exquisite Jewelry"
                    className={inputClass}
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <label className={labelClass} htmlFor="metaDescription">
                    Meta Description
                  </label>
                  <input
                    id="metaDescription"
                    name="metaDescription"
                    type="text"
                    value={form.metaDescription}
                    onChange={handleChange}
                    placeholder="Discover timeless jewelry crafted with care."
                    className={inputClass}
                  />
                </div>

                {/* Meta Keywords */}
                <div>
                  <label className={labelClass} htmlFor="metaKeywords">
                    Meta Keywords
                  </label>
                  <input
                    id="metaKeywords"
                    name="metaKeywords"
                    type="text"
                    value={form.metaKeywords}
                    onChange={handleChange}
                    placeholder="jewelry, gold, rings, necklaces"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-charcoal-400">
                    Separate keywords with commas.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-cream-200" />

                {/* Favicon */}
                <ImageUpload
                  label="Favicon"
                  currentUrl={form.faviconUrl}
                  onUpload={handleFaviconUpload}
                  uploading={uploadingFavicon}
                  previewSize="sm"
                />

                {/* Logo */}
                <ImageUpload
                  label="Site Logo"
                  currentUrl={form.logoUrl}
                  onUpload={handleLogoUpload}
                  uploading={uploadingLogo}
                  previewSize="md"
                />

                {/* Save */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white font-medium transition-colors disabled:opacity-50 rounded"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Email (Resend) Tab ─────────────────────────────────────────── */}
            {activeTab === "email" && (
              <div className={cardClass}>
                {/* Info note */}
                <div className="flex items-start gap-3 bg-cream-100 border border-cream-200 rounded px-4 py-3">
                  <Info className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-charcoal-600 leading-relaxed">
                    Resend API credentials are used to send order confirmation emails. Get your API key at resend.com.
                  </p>
                </div>

                {/* Resend API Key */}
                <div>
                  <label className={labelClass} htmlFor="resendApiKey">
                    Resend API Key
                  </label>
                  <input
                    id="resendApiKey"
                    name="resendApiKey"
                    type="password"
                    value={form.resendApiKey}
                    onChange={handleChange}
                    placeholder="re_..."
                    className={inputClass}
                  />
                </div>

                {/* From Email */}
                <div>
                  <label className={labelClass} htmlFor="smtpFrom">
                    From Email
                  </label>
                  <input
                    id="smtpFrom"
                    name="smtpFrom"
                    type="email"
                    value={form.smtpFrom}
                    onChange={handleChange}
                    placeholder="no-reply@shreejewels.com"
                    className={inputClass}
                  />
                </div>

                {/* Order Email Subject */}
                <div>
                  <label className={labelClass} htmlFor="orderEmailSubject">
                    Order Confirmation Email Subject
                  </label>
                  <input
                    id="orderEmailSubject"
                    name="orderEmailSubject"
                    type="text"
                    value={form.orderEmailSubject}
                    onChange={handleChange}
                    placeholder="Your Order Confirmation - Shree Jewels"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-charcoal-400">
                    Variables available: {'{{orderId}}'}, {'{{siteName}}'}
                  </p>
                </div>

                {/* Order Email Template */}
                <div>
                  <label className={labelClass} htmlFor="orderEmailTemplate">
                    Order Email Template (HTML)
                  </label>
                  <textarea
                    id="orderEmailTemplate"
                    name="orderEmailTemplate"
                    rows={12}
                    value={form.orderEmailTemplate}
                    onChange={handleChange}
                    placeholder="Leave blank to use default template..."
                    className={`${inputClass} font-mono text-xs`}
                  />
                  <p className="mt-1 text-xs text-charcoal-400">
                    Variables available: {'{{siteName}}'}, {'{{userName}}'}, {'{{orderId}}'}, {'{{itemRows}}'}, {'{{discountLine}}'}, {'{{shippingLine}}'}, {'{{totalAmount}}'}
                  </p>
                </div>

                {/* Save */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white font-medium transition-colors disabled:opacity-50 rounded"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ── About Us Tab ─────────────────────────────────────────────── */}
            {activeTab === "about" && (
              <div className={cardClass}>
                {/* About Title */}
                <div>
                  <label className={labelClass} htmlFor="aboutTitle">
                    About Title
                  </label>
                  <input
                    id="aboutTitle"
                    name="aboutTitle"
                    type="text"
                    value={form.aboutTitle}
                    onChange={handleChange}
                    placeholder="Our Story"
                    className={inputClass}
                  />
                </div>

                {/* About Content */}
                <div>
                  <label className={labelClass} htmlFor="aboutContent">
                    About Content
                  </label>
                  <textarea
                    id="aboutContent"
                    name="aboutContent"
                    rows={10}
                    value={form.aboutContent}
                    onChange={handleChange}
                    placeholder="Tell your customers about ShreeJewels…"
                    className={`${inputClass} resize-y min-h-[160px]`}
                  />
                </div>

                {/* About Image */}
                <div>
                  <p className={labelClass}>About Image</p>
                  <ImageUpload
                    label="About Image"
                    currentUrl={form.aboutImage}
                    onUpload={handleAboutImageUpload}
                    uploading={uploadingAboutImage}
                    previewSize="md"
                  />
                </div>

                {/* Save */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white font-medium transition-colors disabled:opacity-50 rounded"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
