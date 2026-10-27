import Link from "next/link";
import { getCurrentUser } from "@/server/auth/guards";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/server/auth/roles";
import { Calendar, Heart, Shield, User as UserIcon } from "lucide-react";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-900/10 bg-amber-50/80 backdrop-blur-md dark:border-amber-500/10 dark:bg-stone-950/80">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Temple Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform">
            {/* Sacred Diya / Flame Icon */}
            <span className="text-xl font-serif">ॐ</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-tight text-amber-950 dark:text-amber-100 group-hover:text-amber-700 transition-colors">
              Sri Venkateswara Temple
            </span>
            <span className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80 -mt-0.5">
              Sanatana Dharma Trust
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-700 dark:text-stone-300">
          <Link
            href="/events"
            className="flex items-center gap-1.5 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
          >
            <Calendar className="h-4 w-4 text-amber-600" />
            Events & Pujas
          </Link>
          <Link
            href="/gallery"
            className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
          >
            Darshan Gallery
          </Link>
          <Link
            href="/about"
            className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* User / Devotee Action */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {user.role === ROLES.ADMIN ? (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-700/30 text-amber-900 hover:bg-amber-100/60 dark:border-amber-400/30 dark:text-amber-200"
                  >
                    <Shield className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                    Admin Portal
                  </Button>
                </Link>
              ) : null}

              <Link href="/account/bookings">
                <Button
                  size="sm"
                  className="bg-amber-700 hover:bg-amber-800 text-white shadow-sm"
                >
                  <UserIcon className="mr-1.5 h-3.5 w-3.5" />
                  My Bookings
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-800/20 text-stone-800 hover:bg-amber-100/50"
                >
                  Devotee Login
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white shadow-sm"
                >
                  <Heart className="mr-1.5 h-3.5 w-3.5 fill-white/20" />
                  Book Puja
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
