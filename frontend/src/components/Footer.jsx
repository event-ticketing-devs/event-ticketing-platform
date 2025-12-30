import { Link } from "react-router-dom";
import { Ticket, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-text-primary text-white border-t border-text-primary/20 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">
                Eventify
              </span>
            </div>
            <p className="text-bg-primary/80 text-sm leading-relaxed mb-6">
              Your premier destination for discovering and booking amazing
              events. From concerts to conferences, we make event booking simple
              and secure.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/events"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  Browse Events
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  to="/organizer"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  Create Event
                </Link>
              </li>
              <li>
                <Link
                  to="/venue-partner"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  Register Venue
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">
              Get in Touch
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-bg-primary/80 flex-shrink-0 mt-0.5" />
                <p className="text-bg-primary/80 text-sm">
                  123 Event Street, Mumbai,
                  <br />
                  Maharashtra 400001, India
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-bg-primary/80 flex-shrink-0" />
                <a
                  href="mailto:hello@eventify.com"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  hello@eventify.com
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-bg-primary/80 flex-shrink-0" />
                <a
                  href="tel:+911234567890"
                  className="text-bg-primary/80 hover:text-bg-primary transition-colors text-sm cursor-pointer"
                >
                  +91 123 456 7890
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-text-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
            <div className="text-bg-primary/80">
              &copy; {currentYear} <span className="text-bg-primary font-medium">Eventify</span>. All rights reserved.
            </div>

            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-bg-primary/80 hover:text-bg-primary transition-colors cursor-pointer"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-bg-primary/80 hover:text-bg-primary transition-colors cursor-pointer"
              >
                Cookie Policy
              </a>
              <a
                href="#"
                className="text-bg-primary/80 hover:text-bg-primary transition-colors cursor-pointer"
              >
                Refund Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
