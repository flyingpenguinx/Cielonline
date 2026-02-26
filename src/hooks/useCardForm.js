import { useMemo, useState } from "react";

export const templateOptions = ["template-a", "template-b", "template-c", "template-d", "template-e"];

export const colorOptions = [
  "#355dff",
  "#0f766e",
  "#7c3aed",
  "#b45309",
  "#be123c",
  "#1f2937"
];

const emptyCard = {
  full_name: "",
  slug: "",
  title: "",
  company: "",
  bio: "",
  website: "",
  avatar_url: "",
  template_key: "template-a",
  background_color: "#355dff",
  phone_1: "",
  phone_2: "",
  email_1: "",
  email_2: "",
  address: "",
  instagram_url: "",
  linkedin_url: ""
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

    return {
      ...card,
      slug: normalizedSlug,
      full_name: card.full_name.trim(),
      title: card.title.trim(),
      company: card.company.trim(),
      bio: card.bio.trim(),
      website: card.website.trim(),
      avatar_url: card.avatar_url.trim(),
      phone_1: card.phone_1.trim(),
      phone_2: card.phone_2.trim(),
      email_1: card.email_1.trim(),
      email_2: card.email_2.trim(),
      address: card.address.trim(),
      instagram_url: card.instagram_url.trim(),
      linkedin_url: card.linkedin_url.trim()
    };
  }, [card]);

  return { card, updateCard, resetCard, sanitized };
}
