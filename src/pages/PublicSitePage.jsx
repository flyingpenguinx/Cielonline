import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

function renderBlock(block) {
  const { block_type: type, content } = block;

  switch (type) {
    case "hero":
      return (
        <section
          key={block.id}
          className="pub-hero"
          style={{
            backgroundColor: content.backgroundColor || "#1e293b",
            color: content.textColor || "#fff",
            textAlign: content.align || "center",
          }}
        >
          <h1>{content.title}</h1>
          {content.subtitle && <p>{content.subtitle}</p>}
        </section>
      );

    case "heading": {
      const Tag = `h${content.level || 2}`;
      return <Tag key={block.id} style={{ textAlign: content.align || "left" }}>{content.text}</Tag>;
    }

    case "text":
      return (
        <p key={block.id} style={{ textAlign: content.align || "left", whiteSpace: "pre-wrap" }}>
          {content.text}
        </p>
      );

    case "image":
      return content.src ? (
        <figure key={block.id} className="pub-image">
          <img src={content.src} alt={content.alt || ""} style={{ width: content.width || "100%" }} />
          {content.caption && <figcaption>{content.caption}</figcaption>}
        </figure>
      ) : null;

    case "button":
      return (
        <div key={block.id} style={{ textAlign: content.align || "center" }}>
          <a
            className={`site-btn site-btn-${content.variant || "primary"}`}
            href={content.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content.text || "Button"}
          </a>
        </div>
      );

    case "divider":
      return <hr key={block.id} style={{ borderStyle: content.style || "solid" }} className="pub-divider" />;

    case "spacer":
      return <div key={block.id} style={{ height: content.height || 40 }} />;

    case "columns":
      return (
        <div
          key={block.id}
          className="pub-columns"
          style={{ gridTemplateColumns: `repeat(${content.count || 2}, 1fr)` }}
        >
          {(content.items || []).map((col, i) => (
            <div key={i} className="pub-column">
              {col.heading && <h3>{col.heading}</h3>}
              {col.text && <p>{col.text}</p>}
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

export default function PublicSitePage() {
  const { slug } = useParams();
  const [site, setSite] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Service unavailable.");
      setLoading(false);
      return;
    }

    (async () => {
      const { data: siteData, error: siteErr } = await supabase
        .from("client_sites")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (siteErr || !siteData) {
        setError("Site not found.");
        setLoading(false);
        return;
      }

      setSite(siteData);

      const { data: blockData } = await supabase
        .from("site_blocks")
        .select("*")
        .eq("site_id", siteData.id)
        .order("sort_order", { ascending: true });

      setBlocks(blockData ?? []);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: "60vh" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <main className="container main-space fade-in" style={{ textAlign: "center" }}>
        <h2>{error}</h2>
        <p className="muted">The page you are looking for does not exist or is not published.</p>
      </main>
    );
  }

  return (
    <main className="public-site fade-in">
      {site.favicon_url && (
        <link rel="icon" href={site.favicon_url} />
      )}
      <div className="public-site-content">
        {blocks.map(renderBlock)}
      </div>
    </main>
  );
}
