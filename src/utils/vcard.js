function esc(value) {
  return (value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function buildVCard(card) {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const name = card.full_name || "Unnamed Contact";
  const split = name.trim().split(/\s+/);
  const first = split[0] ?? "";
  const last = split.slice(1).join(" ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(name)}`,
    `N:${esc(last)};${esc(first)};;;`
  ];

  if (card.company) lines.push(`ORG:${esc(card.company)}`);
  if (card.title) lines.push(`TITLE:${esc(card.title)}`);
  if (card.phone_1) lines.push(`TEL;TYPE=CELL:${esc(card.phone_1)}`);
  if (card.phone_2) lines.push(`TEL;TYPE=WORK:${esc(card.phone_2)}`);
  if (card.email_1) lines.push(`EMAIL;TYPE=INTERNET:${esc(card.email_1)}`);
  if (card.email_2) lines.push(`EMAIL;TYPE=WORK:${esc(card.email_2)}`);
  if (card.website) lines.push(`URL:${esc(card.website)}`);
  if (card.address) lines.push(`ADR;TYPE=WORK:;;${esc(card.address)};;;;`);
  if (card.bio) lines.push(`NOTE:${esc(card.bio)}`);

  // Social media URLs
  if (card.instagram_url) lines.push(`X-SOCIALPROFILE;TYPE=instagram:${esc(card.instagram_url)}`);
  if (card.linkedin_url) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${esc(card.linkedin_url)}`);
  if (card.facebook_url) lines.push(`X-SOCIALPROFILE;TYPE=facebook:${esc(card.facebook_url)}`);
  if (card.twitter_url) lines.push(`X-SOCIALPROFILE;TYPE=twitter:${esc(card.twitter_url)}`);
  if (card.tiktok_url) lines.push(`X-SOCIALPROFILE;TYPE=tiktok:${esc(card.tiktok_url)}`);
  if (card.youtube_url) lines.push(`URL;TYPE=youtube:${esc(card.youtube_url)}`);
  if (card.github_url) lines.push(`URL;TYPE=github:${esc(card.github_url)}`);

  // Avatar / photo
  if (card.avatar_url) lines.push(`PHOTO;VALUE=uri:${esc(card.avatar_url)}`);

  lines.push(`REV:${now}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadVCard(card) {
  const vcard = buildVCard(card);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${card.slug || "contact"}.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
