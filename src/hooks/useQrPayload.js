import { useMemo } from "react";

export function useQrPayload(type, values) {
  return useMemo(() => {
    if (type === "card") {
      if (!values.cardSlug) return "";
      return `${window.location.origin}/c/${values.cardSlug}`;
    }

    if (type === "url") {
      return values.targetUrl?.trim() ?? "";
    }

    if (type === "wifi") {
      const ssid = (values.ssid ?? "").trim().replace(/;/g, "\\;");
      const password = (values.password ?? "").trim().replace(/;/g, "\\;");
      const encryption = values.encryption || "WPA";
      const hidden = values.hidden ? "true" : "false";
      if (!ssid) return "";
      return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
    }

    return "";
  }, [type, values]);
}
