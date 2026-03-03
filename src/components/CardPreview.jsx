import { initialsFromName } from "../utils/initials";

function ContactRows({ card }) {
  const rows = [card.phone_1, card.phone_2, card.email_1, card.email_2, card.website, card.address].filter(Boolean);
  return (
    <div className="contact-rows">
      {rows.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

function Avatar({ card }) {
  if (card.avatar_url) {
    return <img className="avatar" src={card.avatar_url} alt={`${card.full_name} avatar`} />;
  }
  return <div className="avatar initials">{initialsFromName(card.full_name)}</div>;
}

function TemplateA({ card }) {
  return (
    <article className="template-card template-a" style={{ "--template-bg": card.background_color }}>
      <Avatar card={card} />
      <h3>{card.full_name || "Carlos Leon"}</h3>
      <p>{card.title}</p>
      <p>{card.company}</p>
      <ContactRows card={card} />
    </article>
  );
}

function TemplateB({ card }) {
  return (
    <article className="template-card template-b" style={{ "--template-bg": card.background_color }}>
      <div>
        <h3>{card.full_name || "Carlos Leon"}</h3>
        <p>{card.title}</p>
      </div>
      <Avatar card={card} />
      <ContactRows card={card} />
    </article>
  );
}

function TemplateC({ card }) {
  return (
    <article className="template-card template-c" style={{ "--template-bg": card.background_color }}>
      <Avatar card={card} />
      <div>
        <h3>{card.full_name || "Carlos Leon"}</h3>
        <p>{card.company}</p>
        <p>{card.bio}</p>
      </div>
      <ContactRows card={card} />
    </article>
  );
}

function TemplateD({ card }) {
  return (
    <article className="template-card template-d" style={{ "--template-bg": card.background_color }}>
      <h3>{card.full_name || "Carlos Leon"}</h3>
      <Avatar card={card} />
      <p>{card.title}</p>
      <ContactRows card={card} />
    </article>
  );
}

function TemplateE({ card }) {
  return (
    <article className="template-card template-e" style={{ "--template-bg": card.background_color }}>
      <Avatar card={card} />
      <div>
        <h3>{card.full_name || "Carlos Leon"}</h3>
        <p>{card.title}</p>
        <p>{card.company}</p>
      </div>
      <ContactRows card={card} />
    </article>
  );
}

export default function CardPreview({ card }) {
  if (card.template_key === "template-b") return <TemplateB card={card} />;
  if (card.template_key === "template-c") return <TemplateC card={card} />;
  if (card.template_key === "template-d") return <TemplateD card={card} />;
  if (card.template_key === "template-e") return <TemplateE card={card} />;
  return <TemplateA card={card} />;
}
