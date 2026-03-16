const LOGO_SRC = "/assets/images/Bajaj_Logo.png";

const basePrintStyles = `
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 16px; }
  .print-header { display: flex; align-items: center; gap: 12px; padding: 8px 0 12px; border-bottom: 2px solid #0f766e; margin-bottom: 12px; }
  .print-logo { height: 48px; width: auto; }
  .print-brand { font-weight: 700; font-size: 16px; color: #0f766e; letter-spacing: 0.3px; }
  .print-title { font-weight: 600; font-size: 13px; color: #1f2937; }
  .print-subtitle { font-weight: 700; margin: 10px 0 2px; color: #111827; }
  .print-table { border-collapse: collapse; margin: 4px 0 12px; width: 100%; }
  .print-table th, .print-table td { text-align: left; padding: 4px 8px; vertical-align: top; border: 1px solid #374151; }
  .print-bold { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
  th, td { border: 1px solid #374151; padding: 6px 8px; }
  @page { size: auto; margin: 12mm; }
`;

export function openPrintWindow({ title = "Bajaj Sugar", contentHtml = "", subtitle = "" } = {}) {
  const win = window.open("", "_blank", "width=1000,height=900");
  if (!win) return null;

  const safeTitle = title || "Bajaj Sugar";
  const sub = subtitle ? `<div class="print-title">${subtitle}</div>` : "";

  win.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
        <style>${basePrintStyles}</style>
      </head>
      <body>
        <div class="print-header">
          <img src="${LOGO_SRC}" alt="Bajaj Sugar" class="print-logo" />
          <div>
            <div class="print-brand">Bajaj Sugar</div>
            <div class="print-title">${safeTitle}</div>
            ${sub}
          </div>
        </div>
        ${contentHtml}
      </body>
    </html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
  return win;
}

export function printElement(element, opts = {}) {
  if (!element) return null;
  return openPrintWindow({ ...opts, contentHtml: element.outerHTML });
}
