"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-8 text-center space-y-3 animate-in fade-in-0">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
          Inquiry Successfully Received
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
          Thank you for reaching out to Sri Venkateswara Temple Trust. Our temple office has logged your request and will respond via email within 24 business hours.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSubmitted(false)}
          className="text-xs mt-2"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="devotee-name">Your Full Name *</Label>
          <Input id="devotee-name" placeholder="Devotee Name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="devotee-phone">Contact Phone Number *</Label>
          <Input id="devotee-phone" type="tel" placeholder="+91 98765 43210" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="devotee-email">Email Address *</Label>
        <Input id="devotee-email" type="email" placeholder="devotee@example.com" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inquiry-subject">Inquiry Nature *</Label>
        <select
          id="inquiry-subject"
          className="flex h-9 w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-amber-500"
        >
          <option value="puja">Special Seva / Sankalpam Booking Query</option>
          <option value="kalyanam">Kalyanotsavam Hall Availability</option>
          <option value="annadanam">Nitya Annadanam Donation Sponsorship</option>
          <option value="general">General Temple Visit & Darshan Assistance</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message Details *</Label>
        <Textarea
          id="message"
          rows={4}
          placeholder="Please describe your seva request or question..."
          required
        />
      </div>

      <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex items-center gap-2 text-xs text-stone-500">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          Devotee privacy is sacred. We never share your phone number or email with third parties.
        </span>
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs h-9"
      >
        <Send className="mr-1.5 h-3.5 w-3.5" />
        Submit Devotee Inquiry
      </Button>
    </form>
  );
}
