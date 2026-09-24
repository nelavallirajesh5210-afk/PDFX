import React, { useState } from 'react';
import { Menu, X, Check } from 'lucide-react';
import { ToolType } from '../types/pdf';

interface HeaderProps {
  activeTool: ToolType | null;
  onSelectTool: (tool: ToolType | null) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSelectTool }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [loginSubmitted, setLoginSubmitted] = useState(false);

  const navigateTo = (hashId: string) => {
    setMobileMenuOpen(false);
    onSelectTool(null);
    setTimeout(() => {
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onSelectTool(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/10 bg-mist/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:py-3.5">
          {/* Logo matching screenshot */}
          <button
            onClick={handleHomeClick}
            aria-label="PDFX home"
            className="flex shrink-0 items-center gap-2.5 cursor-pointer text-left border-none bg-transparent"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-head text-xs font-extrabold text-primary-foreground shadow-2xs">
              PX
            </span>
            <span className="font-head text-xl font-bold tracking-tight text-foreground">
              PDFX
            </span>
          </button>

          {/* Center Navigation Links (Desktop) matching screenshot */}
          <nav className="hidden items-center gap-1.5 md:flex">
            <button
              onClick={() => navigateTo('all-tools')}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-primary-soft/70 hover:text-primary transition-colors cursor-pointer"
            >
              Tools
            </button>
            <button
              onClick={() => navigateTo('how-it-works')}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-primary-soft/70 hover:text-primary transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => navigateTo('pricing')}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-primary-soft/70 hover:text-primary transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Action Buttons matching screenshot */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="hidden sm:inline-flex h-9.5 px-4 py-2 text-sm font-semibold rounded-xl text-foreground/75 hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              Log in
            </button>
            <button
              onClick={() => navigateTo('pricing')}
              className="hidden sm:inline-flex h-9.5 px-4.5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              Get Pro
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-10 w-10 grid place-items-center rounded-xl hover:bg-accent hover:text-foreground cursor-pointer text-foreground/75"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <nav className="border-t border-line/5 px-5 py-4 md:hidden bg-mist">
            <div className="mx-auto grid max-w-6xl gap-1">
              <button
                onClick={() => navigateTo('all-tools')}
                className="text-left rounded-lg px-3 py-3 text-sm font-medium hover:bg-primary-soft text-foreground cursor-pointer"
              >
                Tools
              </button>
              <button
                onClick={() => navigateTo('how-it-works')}
                className="text-left rounded-lg px-3 py-3 text-sm font-medium hover:bg-primary-soft text-foreground cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => navigateTo('pricing')}
                className="text-left rounded-lg px-3 py-3 text-sm font-medium hover:bg-primary-soft text-foreground cursor-pointer"
              >
                Pricing
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-line/5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="h-9 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background shadow-xs hover:bg-accent text-center"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigateTo('pricing')}
                  className="h-9 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 text-center"
                >
                  Get Pro
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Log In Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-line/10 bg-mist p-6 shadow-xl sm:p-8">
            <button
              onClick={() => {
                setLoginModalOpen(false);
                setLoginSubmitted(false);
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-head text-xs font-bold text-primary-foreground">
                PX
              </span>
              <span className="font-head text-lg font-bold">PDFX Account</span>
            </div>

            {loginSubmitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Magic link sent!</h3>
                <p className="text-sm text-muted-foreground">
                  Check <span className="font-medium text-foreground">{emailInput}</span> for your sign-in link.
                </p>
                <button
                  onClick={() => {
                    setLoginModalOpen(false);
                    setLoginSubmitted(false);
                  }}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in with your email to access your PDF history and settings.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (emailInput) setLoginSubmitted(true);
                  }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="you@example.com"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    Send magic link
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  No account needed for basic PDF processing. 100% free.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
