import { initialsFromName } from "../utils/initials";

const PhoneIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>);
const EmailIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>);
const GlobeIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>);
const MapPinIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>);

function ContactRows({ card }) {
  return (
    <div className="contact-rows-modern">
      {card.phone_1 && (
        <a href={	el:\} className="contact-item">
          <PhoneIcon /> <span>{card.phone_1}</span>
        </a>
      )}
      {card.phone_2 && (
        <a href={	el:\} className="contact-item">
          <PhoneIcon /> <span>{card.phone_2}</span>
        </a>
      )}
      {card.email_1 && (
        <a href={mailto:\} className="contact-item">
          <EmailIcon /> <span>{card.email_1}</span>
        </a>
      )}
      {card.email_2 && (
        <a href={mailto:\} className="contact-item">
          <EmailIcon /> <span>{card.email_2}</span>
        </a>
      )}
      {card.website && (
        <a href={card.website.startsWith('http') ? card.website : https://\} target="_blank" rel="noopener noreferrer" className="contact-item">
          <GlobeIcon /> <span>{card.website}</span>
        </a>
      )}
      {card.address && (
         <div className="contact-item address-item">
           <MapPinIcon /> <span>{card.address}</span>
         </div>
      )}
    </div>
  );
}

function Avatar({ card }) {
  if (card.avatar_url) {
    return <img className="avatar modern-avatar" src={card.avatar_url} alt={\ avatar} />;
  }
  return <div className="avatar initials modern-avatar">{initialsFromName(card.full_name)}</div>;
}

function TemplateA({ card }) {
  return (
    <article className="template-card modern-template modern-template-a" style={{ "--template-bg": card.background_color }}>
      <div className="card-top-accent"></div>
      <div className="card-content">
        <Avatar card={card} />
        <div className="card-header-info">
          <h3>{card.full_name || "Carlos Leon"}</h3>
          <p className="job-title">{card.title}</p>
          <p className="company-name">{card.company}</p>
        </div>
        <ContactRows card={card} />
      </div>
    </article>
  );
}

function TemplateB({ card }) {
  return (
    <article className="template-card modern-template modern-template-b" style={{ "--template-bg": card.background_color }}>
      <div className="card-content">
        <div className="card-header-horizontal">
          <div className="header-text">
            <h3>{card.full_name || "Carlos Leon"}</h3>
            <p className="job-title">{card.title}</p>
            <p className="company-name">{card.company}</p>
          </div>
          <Avatar card={card} />
        </div>
        <ContactRows card={card} />
      </div>
    </article>
  );
}

function TemplateC({ card }) {
  return (
    <article className="template-card modern-template modern-template-c" style={{ "--template-bg": card.background_color }}>
      <div className="split-layout">
        <div className="split-left">
          <Avatar card={card} />
        </div>
        <div className="split-right">
          <h3>{card.full_name || "Carlos Leon"}</h3>
          <p className="job-title">{card.title}</p>
          <p className="company-name">{card.company}</p>
          <ContactRows card={card} />
        </div>
      </div>
    </article>
  );
}

function TemplateD({ card }) {
  return (
    <article className="template-card modern-template modern-template-d" style={{ "--template-bg": card.background_color }}>
      <div className="card-content centered-content">
        <Avatar card={card} />
        <h3>{card.full_name || "Carlos Leon"}</h3>
        <p className="job-title">{card.title}</p>
        <p className="company-name">{card.company}</p>
        <div className="divider"></div>
        <ContactRows card={card} />
      </div>
    </article>
  );
}

function TemplateE({ card }) {
  return (
    <article className="template-card modern-template modern-template-e" style={{ "--template-bg": card.background_color }}>
      <div className="glass-content">
        <div className="card-header-info">
          <h3>{card.full_name || "Carlos Leon"}</h3>
          <p className="job-title">{card.title}</p>
          <p className="company-name">{card.company}</p>
        </div>
        <Avatar card={card} />
        <ContactRows card={card} />
      </div>
    </article>
  );
}

export default function CardPreview({ template, card, wrapperClass = "" }) {
  if (!card) return null;
  const classes = card-preview \;

  const renderTemplate = () => {
    switch (template) {
      case "A": return <TemplateA card={card} />;
      case "B": return <TemplateB card={card} />;
      case "C": return <TemplateC card={card} />;
      case "D": return <TemplateD card={card} />;
      case "E": return <TemplateE card={card} />;
      default:  return <TemplateA card={card} />;
    }
  };

  return <div className={classes}>{renderTemplate()}</div>;
}
