import { useMemo, useState } from "react";

export const templateOptions = [
  { key: "template-a", label: "Classic", icon: "📋" },
  { key: "template-b", label: "Split", icon: "🔲" },
  { key: "template-c", label: "Sidebar", icon: "📐" },
  { key: "template-d", label: "Centered", icon: "🎯" },
  { key: "template-e", label: "Glass", icon: "✨" },
];

export const cardStyleOptions = [
  { key: "flat", label: "Flat" },
  { key: "glossy", label: "Glossy" },
  { key: "gradient", label: "Gradient" },
  { key: "minimal", label: "Minimal" },
];

export const presetColors = [
  "#355dff", "#0f766e", "#7c3aed", "#b45309",
  "#be123c", "#1f2937", "#059669", "#d946ef",
  "#0891b2", "#ea580c", "#4f46e5", "#000000",
];

const emptyCard = {
  full_name: "",
  slug: "",
  title: "",
  company: "",
  bio: "",
  tagline: "",
  website: "",
  avatar_url: "",
  logo_url: "",
  template_key: "template-a",
  card_style: "flat",
  font_style: "default",
  border_radius: "rounded",
  background_color: "#355dff",
  text_color: "#0f172a",
  show_logo: false,
  show_qr_on_card: false,
  phone_1: "",
  phone_2: "",
  email_1: "",
  email_2: "",
  address: "",
  instagram_url: "",
  linkedin_url: "",
  facebook_url: "",
  twitter_url: "",
  tiktok_url: "",
  youtube_url: "",
  github_url: "",
};

export function useCardForm(initialData = {}) {
  const [card, setCard] = useState({ ...emptyCard, ...initialData });

  const updateCard = (field, value) => {
    setCard((prev) => ({ ...prev, [field]: value }));
  };

  const resetCard = () => setCard(emptyCard);

  const sanitized = useMemo(() => {
    const normalizedSlug = card.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    const trimField = (key) => (card[key] ?? "").trim();

    return {
      ...card,
      slug: normalizedSlug,
      full_name: trimField("full_name"),
      title: trimField("title"),
      company: trimField("company"),
      bio: trimField("bio"),
      website: trimField("website"),
      avatar_url: trimField("avatar_url"),
      phone_1: trimField("phone_1"),
      phone_2: trimField("phone_2"),
      email_1: trimField("email_1"),
      email_2: trimField("email_2"),
      address: trimField("address"),
      instagram_url: trimField("instagram_url"),
      linkedin_url: trimField("linkedin_url"),
      facebook_url: trimField("facebook_url"),
      twitter_url: trimField("twitter_url"),
      tiktok_url: trimField("tiktok_url"),
      youtube_url: trimField("youtube_url"),
      github_url: trimField("github_url"),
    };
  }, [card]);

  return { card, updateCard, resetCard, sanitized };
}
