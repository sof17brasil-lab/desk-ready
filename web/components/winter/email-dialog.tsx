"use client";

/**
 * The playbook emails, in a dialog.
 *
 * In the cards the templates were clipped at every screen size. They now sit
 * behind a "View email" button and open in a Radix dialog that scrolls its own
 * body, so nothing is ever cropped. Esc closes it, focus returns to the button,
 * and "Copy email" puts the subject and body on the clipboard.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, Mail, X } from "lucide-react";
import * as React from "react";

export interface EmailTemplate {
  subject: string;
  body: string[];
}

export function EmailDialog({ title, email }: { title: string; email: EmailTemplate }) {
  const [copied, setCopied] = React.useState(false);

  // Radix locks body scroll while the dialog is open. Lenis runs its own loop
  // and would keep scrolling behind the overlay, so pause it for the duration.
  const onOpenChange = (open: boolean) => {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } })
      .__lenis;
    if (!lenis) return;
    open ? lenis.stop() : lenis.start();
  };

  const plain = `Subject: ${email.subject}\n\n${email.body.join("\n\n")}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog.Root onOpenChange={onOpenChange}>
      <Dialog.Trigger className="btn">
        <Mail aria-hidden="true" className="h-4 w-4" />
        View email
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/60 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] flex max-h-[min(86svh,46rem)] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col border border-ink bg-paper shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
          aria-describedby={undefined}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <p className="marker">Email template</p>
              <Dialog.Title className="mt-1 text-lg font-semibold">{title}</Dialog.Title>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-line transition-colors hover:border-ink"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* The body scrolls inside the dialog, so long templates are never cut. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <p className="text-sm font-semibold">Subject: {email.subject}</p>
            <div className="mt-4 space-y-3.5">
              {email.body.map((line, i) => (
                <p key={i} className="text-[0.9375rem] leading-relaxed text-deep">
                  {line}
                </p>
              ))}
            </div>
            <p className="source mt-6">
              Square brackets are placeholders. Replace them before sending.
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-line px-6 py-4">
            <button type="button" onClick={copy} className="btn btn-solid">
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy email"}
            </button>
            <Dialog.Close className="btn">Close</Dialog.Close>
            <span aria-live="polite" className="sr-only">
              {copied ? "Email copied to clipboard" : ""}
            </span>
            <p className="source ml-auto hidden sm:block">Press Esc to close</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
