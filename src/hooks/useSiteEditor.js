import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const BLOCK_DEFAULTS = {
  hero: { title: "Welcome to Our Site", subtitle: "Your tagline goes here", backgroundColor: "#1e293b", textColor: "#ffffff", align: "center" },
  heading: { text: "Section Heading", level: 2, align: "left" },
  text: { text: "Click to edit this text. Add your content here to tell your story.", align: "left" },
  image: { src: "", alt: "Image description", caption: "", width: "100%" },
  button: { text: "Learn More", url: "#", align: "center", variant: "primary" },
  divider: { style: "solid" },
  spacer: { height: 40 },
  gallery: { images: [], columns: 3 },
  columns: { count: 2, items: [{ heading: "Column 1", text: "Content" }, { heading: "Column 2", text: "Content" }] },
  services_list: { heading: "Our Services", show_price: true, show_duration: true, show_description: true, columns: 2 },
  contact_form: { heading: "Get in Touch", subtitle: "Fill out the form and we'll get back to you shortly.", button_text: "Send Message", show_service_picker: true, show_vehicle_field: true, show_preferred_date: true, success_message: "Thank you! We'll be in touch shortly." },
  video: { url: "", caption: "" },
  map: { embed_url: "", height: 400 },
};

export function useSiteEditor(user, initialSiteId) {
  const [sites, setSites] = useState([]);
  const [activeSite, setActiveSite] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const loadSites = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("client_sites")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }
    setSites(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const loadBlocks = useCallback(async (siteId) => {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase
      .from("site_blocks")
      .select("*")
      .eq("site_id", siteId)
      .order("sort_order", { ascending: true });
    if (error) {
      setStatus(error.message);
      return [];
    }
    return data ?? [];
  }, []);

  // Auto-open site when initialSiteId is provided (used by admin WebsiteTab)
  useEffect(() => {
    if (!initialSiteId || activeSite) return;
    const match = sites.find((s) => s.id === initialSiteId);
    if (match) {
      setActiveSite(match);
      loadBlocks(match.id).then(setBlocks);
    }
  }, [initialSiteId, sites, activeSite, loadBlocks]);

  const openSite = useCallback(async (site) => {
    setActiveSite(site);
    setSelectedBlockId(null);
    setStatus("");
    const loaded = await loadBlocks(site.id);
    setBlocks(loaded);
  }, [loadBlocks]);

  const closeSite = useCallback(() => {
    setActiveSite(null);
    setBlocks([]);
    setSelectedBlockId(null);
    setStatus("");
  }, []);

  const addBlock = useCallback((type) => {
    const newBlock = {
      id: crypto.randomUUID(),
      block_type: type,
      content: { ...BLOCK_DEFAULTS[type] },
      sort_order: blocks.length,
      _isNew: true,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, [blocks.length]);

  const updateBlock = useCallback((id, content) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)));
  }, []);

  const deleteBlock = useCallback((id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBlockId((prev) => (prev === id ? null : prev));
  }, []);

  const moveBlock = useCallback((id, direction) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((b, i) => ({ ...b, sort_order: i }));
    });
  }, []);

  const saveBlocks = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !activeSite) {
      setStatus("Configure Supabase to save changes.");
      return;
    }
    setSaving(true);
    setStatus("");

    // Delete existing blocks then insert fresh
    const { error: delError } = await supabase
      .from("site_blocks")
      .delete()
      .eq("site_id", activeSite.id);

    if (delError) {
      setStatus(delError.message);
      setSaving(false);
      return;
    }

    const rows = blocks.map((b, i) => ({
      site_id: activeSite.id,
      block_type: b.block_type,
      content: b.content,
      sort_order: i,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from("site_blocks").insert(rows);
      if (error) {
        setStatus(error.message);
        setSaving(false);
        return;
      }
    }

    setStatus("Site saved successfully!");
    setSaving(false);
    // Reload to get server-generated IDs
    const fresh = await loadBlocks(activeSite.id);
    setBlocks(fresh);
  }, [activeSite, blocks, loadBlocks]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  return {
    sites,
    activeSite,
    blocks,
    selectedBlockId,
    selectedBlock,
    saving,
    loading,
    status,
    setStatus,
    openSite,
    closeSite,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    saveBlocks,
    setSelectedBlockId,
    loadSites,
  };
}
