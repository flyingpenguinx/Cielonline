const TEMPLATE_LIBRARY = [
  {
    key: "vivid-signature",
    label: "Vivid Signature",
    icon: "◇",
    description: "Dark premium landing page with bold hero, trust highlights, services, gallery, and quote capture.",
    blocks: [
      {
        block_type: "hero",
        content: {
          title: "Premium auto detailing that looks as polished as the cars.",
          subtitle: "Use this as the baseline Vivid-style hero: high contrast, controlled spacing, direct CTA copy, and a luxury-service tone.",
          backgroundColor: "#101828",
          textColor: "#f8fafc",
          align: "center",
        },
      },
      {
        block_type: "button",
        content: {
          text: "Book a detail",
          url: "#contact",
          align: "center",
          variant: "primary",
          backgroundColor: "#c89b3c",
          textColor: "#101828",
        },
      },
      {
        block_type: "columns",
        content: {
          count: 3,
          backgroundColor: "#ffffff",
          textColor: "#0f172a",
          items: [
            { heading: "Mobile convenience", text: "Bring premium detailing to the driveway without sacrificing finish quality or customer experience." },
            { heading: "Luxury presentation", text: "Use concise proof points and clean cards the way Vivid does: nothing crowded, nothing casual." },
            { heading: "Conversion-ready", text: "Keep one primary CTA visible in every major section so visitors always know the next step." },
          ],
        },
      },
      {
        block_type: "services_list",
        content: {
          heading: "Signature services",
          show_price: true,
          show_duration: true,
          show_description: true,
          columns: 3,
          backgroundColor: "#0f172a",
          textColor: "#f8fafc",
          cardBackground: "#111c2d",
        },
      },
      {
        block_type: "gallery",
        content: {
          columns: 3,
          images: [
            { src: "", alt: "Exterior detail result", caption: "Add a glossy hero result shot" },
            { src: "", alt: "Interior detail result", caption: "Add a premium interior close-up" },
            { src: "", alt: "Coating or correction result", caption: "Add the highest-value transformation" },
          ],
        },
      },
      {
        block_type: "contact_form",
        content: {
          heading: "Request a quote",
          subtitle: "Keep the form short. The Vivid pattern works because it asks only for the info needed to start the conversation.",
          button_text: "Send request",
          show_service_picker: true,
          show_vehicle_field: true,
          show_preferred_date: true,
          success_message: "Thanks. We will reach out shortly with next steps.",
          backgroundColor: "#ffffff",
          textColor: "#0f172a",
        },
      },
    ],
  },
  {
    key: "vivid-story",
    label: "Vivid Story",
    icon: "▣",
    description: "Editorial service page with a strong intro, story-led copy blocks, and a services section anchored by proof.",
    blocks: [
      {
        block_type: "hero",
        content: {
          title: "Craft a service page that feels deliberate, not stuffed.",
          subtitle: "This layout mirrors the pacing of the Vivid site: dramatic opener, explanation, proof, then action.",
          backgroundColor: "#1b2332",
          textColor: "#f8fafc",
          align: "left",
        },
      },
      {
        block_type: "heading",
        content: {
          text: "Why clients choose this service",
          level: 2,
          align: "left",
          textColor: "#0f172a",
        },
      },
      {
        block_type: "text",
        content: {
          text: "Lead with the result, then explain the process in plain language. Vivid works because it avoids generic filler and keeps every sentence tied to value.",
          align: "left",
          textColor: "#334155",
        },
      },
      {
        block_type: "columns",
        content: {
          count: 2,
          backgroundColor: "#f8fafc",
          textColor: "#0f172a",
          items: [
            { heading: "Service promise", text: "Explain exactly what the customer gets, how long it lasts, and what makes the finish premium." },
            { heading: "Proof and trust", text: "Use process photos, before-and-after results, or a short client quote to reinforce the promise." },
          ],
        },
      },
      {
        block_type: "services_list",
        content: {
          heading: "Packages and pricing",
          show_price: true,
          show_duration: true,
          show_description: true,
          columns: 2,
          backgroundColor: "#ffffff",
          textColor: "#0f172a",
          cardBackground: "#f8fafc",
        },
      },
      {
        block_type: "button",
        content: {
          text: "Start your booking",
          url: "#contact",
          align: "left",
          variant: "primary",
          backgroundColor: "#0f172a",
          textColor: "#f8fafc",
        },
      },
      {
        block_type: "contact_form",
        content: {
          heading: "Tell us about your vehicle",
          subtitle: "Use this for service pages where the user is already warmed up and ready to ask for pricing or scheduling.",
          button_text: "Get pricing",
          show_service_picker: true,
          show_vehicle_field: true,
          show_preferred_date: false,
          success_message: "Your request is in. We will follow up with pricing and availability.",
          backgroundColor: "#f8fafc",
          textColor: "#0f172a",
        },
      },
    ],
  },
  {
    key: "vivid-showcase",
    label: "Vivid Showcase",
    icon: "◫",
    description: "Gallery-first layout for correction, coating, tint, and other visual services where proof needs to lead the page.",
    blocks: [
      {
        block_type: "hero",
        content: {
          title: "Show the finish first.",
          subtitle: "This template puts transformation shots and premium service positioning ahead of dense copy.",
          backgroundColor: "#111827",
          textColor: "#f8fafc",
          align: "center",
        },
      },
      {
        block_type: "gallery",
        content: {
          columns: 3,
          images: [
            { src: "", alt: "Paint correction result", caption: "Hero result" },
            { src: "", alt: "Ceramic coating finish", caption: "Coating gloss shot" },
            { src: "", alt: "Detailed interior", caption: "Interior refinement" },
            { src: "", alt: "Wheel or trim restoration", caption: "Detail close-up" },
            { src: "", alt: "Tint finish", caption: "Tint application" },
            { src: "", alt: "Showroom-ready finish", caption: "Final presentation" },
          ],
        },
      },
      {
        block_type: "heading",
        content: {
          text: "What goes into the result",
          level: 2,
          align: "center",
          textColor: "#0f172a",
        },
      },
      {
        block_type: "text",
        content: {
          text: "Use this section for your process and your standards. The tone should stay premium and assured, matching the spacing and restraint of the Vivid site.",
          align: "center",
          textColor: "#475569",
        },
      },
      {
        block_type: "services_list",
        content: {
          heading: "Available packages",
          show_price: true,
          show_duration: true,
          show_description: true,
          columns: 2,
          backgroundColor: "#ffffff",
          textColor: "#0f172a",
          cardBackground: "#f8fafc",
        },
      },
      {
        block_type: "contact_form",
        content: {
          heading: "Ask about your project",
          subtitle: "Ideal for coating, correction, PPF, tint, and other services where the customer may want a tailored quote.",
          button_text: "Request consultation",
          show_service_picker: true,
          show_vehicle_field: true,
          show_preferred_date: true,
          success_message: "Thanks. We will review your request and respond shortly.",
          backgroundColor: "#0f172a",
          textColor: "#f8fafc",
        },
      },
    ],
  },
  {
    key: "vivid-conversion",
    label: "Vivid Conversion",
    icon: "◎",
    description: "Fast booking-oriented layout with fewer sections, prominent trust statements, and a direct lead form.",
    blocks: [
      {
        block_type: "hero",
        content: {
          title: "Book premium detailing without the back-and-forth.",
          subtitle: "A lean landing page structure for ads, promotions, or seasonal booking campaigns.",
          backgroundColor: "#0f172a",
          textColor: "#f8fafc",
          align: "center",
        },
      },
      {
        block_type: "button",
        content: {
          text: "Reserve your spot",
          url: "#contact",
          align: "center",
          variant: "primary",
          backgroundColor: "#d4a646",
          textColor: "#0f172a",
        },
      },
      {
        block_type: "columns",
        content: {
          count: 3,
          backgroundColor: "#ffffff",
          textColor: "#0f172a",
          items: [
            { heading: "Easy scheduling", text: "Reduce friction with a short form and clear next step." },
            { heading: "Premium workmanship", text: "State the level of care, protection, and finish they should expect." },
            { heading: "Transparent pricing", text: "Use the live services block so the admin can update pricing without changing layout." },
          ],
        },
      },
      {
        block_type: "services_list",
        content: {
          heading: "Popular bookings",
          show_price: true,
          show_duration: true,
          show_description: true,
          columns: 2,
          backgroundColor: "#f8fafc",
          textColor: "#0f172a",
          cardBackground: "#ffffff",
        },
      },
      {
        block_type: "contact_form",
        content: {
          heading: "Reserve your appointment",
          subtitle: "Use this on campaign pages where the goal is speed and clarity, not a long brand story.",
          button_text: "Request appointment",
          show_service_picker: true,
          show_vehicle_field: true,
          show_preferred_date: true,
          success_message: "Thanks. We have your request and will confirm availability soon.",
          backgroundColor: "#ffffff",
          textColor: "#0f172a",
        },
      },
      {
        block_type: "map",
        content: {
          embed_url: "",
          height: 360,
        },
      },
    ],
  },
];

function cloneContent(content) {
  return JSON.parse(JSON.stringify(content));
}

export const SITE_TEMPLATE_LIBRARY = TEMPLATE_LIBRARY;

export function getSiteTemplateByKey(templateKey) {
  return TEMPLATE_LIBRARY.find((template) => template.key === templateKey) ?? TEMPLATE_LIBRARY[0];
}

export function createTemplateBlocks(templateKey) {
  const template = getSiteTemplateByKey(templateKey);

  return template.blocks.map((block, index) => ({
    id: crypto.randomUUID(),
    block_type: block.block_type,
    content: cloneContent(block.content),
    sort_order: index,
    _isNew: true,
  }));
}