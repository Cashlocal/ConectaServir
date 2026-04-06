"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const CONECTASERVIR_LOGO =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/eJNAqnoEJSXNihcF.png";

const ROTARY_LOGO =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/dKVDgjXQNCKLeoRo.png";

const links = [
  { href: "/", label: "Início" },
  { href: "/projetos", label: "Projetos" },
  { href: "/voluntarios", label: "Voluntários" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-[100] border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto] items-center gap-x-4 px-6 py-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6 md:px-16 md:py-3">
          <Link
            href="/"
            className="group min-w-0 justify-self-start rounded-lg outline-offset-4"
            aria-label="ConectaServir — Início"
          >
            <Image
              src={CONECTASERVIR_LOGO}
              alt="ConectaServir — Unindo voluntários e projetos sociais"
              width={320}
              height={96}
              className="h-12 w-auto max-w-[min(100%,260px)] object-contain object-left transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:opacity-95 md:h-[72px] md:max-w-[320px]"
              priority
            />
          </Link>

          <div className="hidden justify-self-center opacity-90 transition-opacity duration-200 hover:opacity-100 md:col-start-2 md:row-start-1 md:flex">
            <Image
              src={ROTARY_LOGO}
              alt="Rotary Club de Pato Branco"
              width={200}
              height={72}
              className="h-14 w-auto max-w-[200px] object-contain md:h-[72px] md:max-w-none"
              priority
            />
          </div>

          <nav
            className="hidden items-center gap-8 md:col-start-3 md:row-start-1 md:flex md:justify-self-end"
            aria-label="Principal"
          >
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-md px-1 py-0.5 text-[15px] font-medium text-[#0f172a] no-underline decoration-[#1a44a6] decoration-2 underline-offset-4 transition-all duration-200 hover:text-[#1a44a6] hover:underline"
              >
                {label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="col-start-2 row-start-1 flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-lg border border-[#e2e8f0] text-[#0f172a] transition-colors hover:border-[#1a44a6]/40 hover:bg-[var(--fundo-secao)] md:hidden"
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <span className="text-2xl leading-none" aria-hidden>
                ×
              </span>
            ) : (
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            )}
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[99] md:hidden" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(280px,85vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
              <span className="text-sm font-semibold text-[#0f172a]">Menu</span>
              <button
                type="button"
                className="text-2xl text-[#0f172a]"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg px-4 py-3 text-[15px] font-medium text-[#0f172a] transition-colors duration-200 hover:bg-[var(--fundo-secao)] hover:text-[#1a44a6] active:bg-[#e2e8f0]"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
