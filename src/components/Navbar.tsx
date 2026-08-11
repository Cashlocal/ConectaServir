"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const CONECTASERVIR_LOGO =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/eJNAqnoEJSXNihcF.png";

const ROTARY_LOGO =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/dKVDgjXQNCKLeoRo.png";

const links = [
  { href: "/", label: "Início" },
  { href: "/projetos", label: "Projetos" },
  { href: "/eventos", label: "Eventos" },
  { href: "/voluntarios", label: "Voluntários" },
];

type Usuario = { id: string; nome: string; email: string };

export function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (raw) setUsuario(JSON.parse(raw));
    } catch {
      // localStorage indisponível (SSR) — ignora
    }

    function handleLogin(e: Event) {
      const detail = (e as CustomEvent<Usuario>).detail;
      if (detail) setUsuario(detail);
    }

    window.addEventListener("usuario-autenticado", handleLogin);
    return () => window.removeEventListener("usuario-autenticado", handleLogin);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSair() {
    localStorage.removeItem("usuario");
    setUsuario(null);
    setDropdownOpen(false);
    router.push("/login");
  }

  const inicial = usuario?.nome?.charAt(0).toUpperCase() ?? "?";

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

          {/* Nav desktop */}
          <nav
            className="hidden items-center gap-8 md:col-start-3 md:row-start-1 md:flex md:justify-self-end"
            aria-label="Principal"
          >
            {!usuario ? (
              <>
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="whitespace-nowrap rounded-md px-1 py-0.5 text-[15px] font-medium text-[#0f172a] no-underline decoration-[#1a44a6] decoration-2 underline-offset-4 transition-all duration-200 hover:text-[#1a44a6] hover:underline"
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="ml-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1a44a6] px-4 py-2 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#153575]"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Login
                </Link>
              </>
            ) : (
              /* Avatar + dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d4ed8] text-[15px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                  aria-label="Menu do usuário"
                  aria-expanded={dropdownOpen}
                >
                  {inicial}
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-12 z-[200] w-[200px] overflow-hidden rounded-[12px] bg-white shadow-[0_4px_24px_rgba(29,78,216,0.12)]"
                    style={{ border: "0.5px solid #bfdbfe" }}
                  >
                    {/* Cabeçalho do usuário */}
                    <div className="px-4 py-3">
                      <p className="truncate text-[14px] font-semibold text-[#1e3a8a]">
                        {usuario.nome}
                      </p>
                      <p className="truncate text-[12px] text-[#64748b]">
                        {usuario.email}
                      </p>
                    </div>

                    <div style={{ borderTop: "0.5px solid #e2e8f0" }} />

                    <Link
                      href="/certificados"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-[14px] text-[#0f172a] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                    >
                      Lançar Certificado
                    </Link>

                    <div style={{ borderTop: "0.5px solid #e2e8f0" }} />

                    <Link
                      href="/perfil"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-[14px] text-[#0f172a] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                    >
                      Perfil
                    </Link>

                    <div style={{ borderTop: "0.5px solid #e2e8f0" }} />

                    <button
                      type="button"
                      onClick={handleSair}
                      className="w-full px-4 py-2.5 text-left text-[14px] text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Hamburguer mobile */}
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

      {/* Menu mobile (drawer) */}
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
              {!usuario ? (
                <>
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
                  <Link
                    href="/login"
                    className="mt-2 flex items-center gap-2 rounded-lg bg-[#1a44a6] px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#153575]"
                    onClick={() => setOpen(false)}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Login
                  </Link>
                </>
              ) : (
                <>
                  <div className="mb-2 rounded-lg bg-[#eff6ff] px-4 py-3">
                    <p className="text-[14px] font-semibold text-[#1e3a8a]">
                      {usuario.nome}
                    </p>
                    <p className="text-[12px] text-[#64748b]">{usuario.email}</p>
                  </div>
                  <Link
                    href="/certificados"
                    className="rounded-lg px-4 py-3 text-[15px] font-medium text-[#0f172a] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                    onClick={() => setOpen(false)}
                  >
                    Lançar Certificado
                  </Link>
                  <Link
                    href="/perfil"
                    className="rounded-lg px-4 py-3 text-[15px] font-medium text-[#0f172a] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                    onClick={() => setOpen(false)}
                  >
                    Perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleSair();
                    }}
                    className="rounded-lg px-4 py-3 text-left text-[15px] font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
                  >
                    Sair
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
