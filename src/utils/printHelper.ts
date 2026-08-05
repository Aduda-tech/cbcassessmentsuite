type PrintErrorListener = (title: string, errorMsg: string) => void;
let listener: PrintErrorListener | null = null;

// Subscription verification callback — set by App component
let verifySubscription: (() => Promise<boolean>) | null = null;

export function setSubscriptionVerifier(fn: () => Promise<boolean>) {
  verifySubscription = fn;
}

export function registerPrintListener(cb: PrintErrorListener) {
  listener = cb;
  return () => {
    if (listener === cb) listener = null;
  };
}

/**
 * Converts the current report card DOM to a self-contained HTML file and triggers download.
 */
function downloadAsHTML(reportTitle: string) {
  try {
    let styles = '';
    document.querySelectorAll('style').forEach(el => { styles += el.outerHTML; });

    let containers = document.querySelectorAll('.max-w-7xl');
    let bodyHtml = '';
    if (containers.length > 0) {
      bodyHtml = Array.from(containers).map(c => c.outerHTML).join(
        '<div style="page-break-after: always; margin: 20px 0;"></div>'
      );
    } else {
      bodyHtml = (document.querySelector('main') || document.body).outerHTML;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle}</title>
  <style>
    @media print {
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print\\:hidden { display: none !important; }
    }
    body { background: #fff; font-family: system-ui, sans-serif; }
    ${styles}
  </style>
</head>
<body>${bodyHtml}
<script>setTimeout(function(){window.print();},500);<\/script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reportTitle.replace(/[^a-z0-9 \\-]/gi, '_').replace(/\\s+/g, '_') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    if (listener) {
      listener(reportTitle, 'Report downloaded. Open it and use your browser print to send to a printer or save as PDF.');
    }
  } catch (e: any) {
    console.error('Download fallback failed:', e);
    if (listener) {
      listener(reportTitle, 'Unable to download: ' + (e?.message || ''));
    }
  }
}

/**
 * Executes browser print dialog.
 * Requires active subscription — if verifySubscription is set and returns false, print is blocked.
 */
export async function triggerPrintWithReport(reportTitle: string) {
  // Check subscription before allowing print
  if (verifySubscription) {
    const hasAccess = await verifySubscription();
    if (!hasAccess) {
      // Don't proceed — the subscription paywall will be shown by the app
      return;
    }
  }

  try {
    let printDialogOpened = false;
    const onBeforePrint = () => {
      printDialogOpened = true;
    };
    window.addEventListener('beforeprint', onBeforePrint);

    try {
      window.focus();
    } catch (e) {
      // Ignore focus errors
    }

    window.print();

    setTimeout(() => {
      window.removeEventListener('beforeprint', onBeforePrint);
      if (!printDialogOpened) {
        console.warn('window.print() blocked. Downloading report HTML instead.');
        downloadAsHTML(reportTitle);
      }
    }, 600);
  } catch (err: any) {
    console.warn('window.print() threw error. Downloading report HTML instead.');
    downloadAsHTML(reportTitle);
  }
}

/**
 * Simple trigger without subscription check — for internal use or when already verified.
 */
export function triggerPrintDirect(reportTitle: string) {
  try {
    window.focus();
    window.print();
  } catch (err: any) {
    downloadAsHTML(reportTitle);
  }
}
