"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Menu, X, Calendar, Camera, Info, PhoneCall, Shield, User as UserIcon } from "lucide-react";

interface MobileNavProps {
  userEmail?: string | null;
  isAdmin?: boolean;
}

export function MobileNav({ userEmail, isAdmin }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center gap-2">
      <LanguageSwitcher />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-stone-700 hover:text-amber-800 hover:bg-amber-100/50"
        aria-label="Toggle Navigation Menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-18 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-amber-900/10 shadow-xl p-6 space-y-5 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-stone-800 dark:text-stone-200">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-stone-800"
            >
              Home
            </Link>
            <Link
              href="/events"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-stone-800"
            >
              <Calendar className="h-4 w-4 text-amber-600" />
              Events & Pujas
            </Link>
            <Link
              href="/gallery"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-stone-800"
            >
              <Camera className="h-4 w-4 text-amber-600" />
              Darshan Gallery
            </Link>
            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-stone-800"
            >
              <Info className="h-4 w-4 text-amber-600" />
              About Temple
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-stone-800"
            >
              <PhoneCall className="h-4 w-4 text-amber-600" />
              Contact & Directions
            </Link>
          </nav>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
            {userEmail ? (
              <>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full text-xs h-9 justify-start gap-2 mb-2">
                      <Shield className="h-4 w-4 text-amber-700" />
                      Staff Admin Portal
                    </Button>
                  </Link>
                )}
                <Link href="/account/bookings" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white text-xs h-9 justify-start gap-2">
                    <UserIcon className="h-4 w-4" />
                    My Bookings ({userEmail})
                  </Button>
                </Link>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full text-xs h-9">
                    Login
                  </Button>
                </Link>
                <Link href="/events" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white text-xs h-9">
                    Book Puja
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
