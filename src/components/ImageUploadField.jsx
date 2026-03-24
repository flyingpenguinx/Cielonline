import { useState, useRef } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

/**
 * Reusable image field with drag-and-drop upload + URL fallback.
 * Uploads to Supabase Storage bucket "images".
 */
export default function ImageUploadField({ value, onChange, label = "Image", placeholder = "Paste URL or upload", compact = false }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file || !isSupabaseConfigured || !supabase) {
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const allowed = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];
    if (!allowed.includes(ext)) return;

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) return;

    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    setUploading(true);

    try {
      const { error } = await supabase.storage.from("images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        console.error("Upload error:", error.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
      if (urlData?.publicUrl) {
        onChange(urlData.publicUrl);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  return (
    <div className={`image-upload-field ${compact ? "compact" : ""}`}>
      {label && <span className="image-upload-label">{label}</span>}

      {/* Drop zone */}
      <div
        className={`image-upload-dropzone ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <span className="image-upload-status">Uploading…</span>
        ) : value ? (
          <img src={value} alt="Preview" className="image-upload-thumb" />
        ) : (
          <div className="image-upload-placeholder-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            <span>Drop image or click to upload</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif"
          onChange={handleFileChange}
          className="image-upload-hidden-input"
        />
      </div>

      {/* URL fallback */}
      <input
        type="text"
        className="image-upload-url-input"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      {value && (
        <button type="button" className="image-upload-clear" onClick={() => onChange("")}>
          ✕ Remove
        </button>
      )}
    </div>
  );
}
