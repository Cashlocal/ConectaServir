"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const CONECTASERVIR_LOGO =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/eJNAqnoEJSXNihcF.png";

const ROTARY_LOGO =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/dKVDgjXQNCKLeoRo.png";

const ALL_LINKS = [
  { href: "/",                   label: "Início",      somente: "todos" },
  { href: "/projetos",           label: "Projetos",    somente: "todos" },
  { href: "/eventos",            label: "Eventos",     somente: "todos" },
  { href: "/voluntarios",        label: "Voluntários", somente: "todos" },
  { href: "/consultar-demandas", label: "Demandas",    somente: "todos" },
  { href: "/entidades/cadastrar",label: "Entidades",   somente: "publico" },
  { href: "/contato",            label: "Contato",     somente: "todos" },
] as const;

type Usuario = {
  id: string;
  nome: string;
  email: string;
  foto?: string | null;
  tipo?: string;
  cnpjEntidade?: string;
  entidadeId?: string;
};

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
  const isEntidade = usuario?.tipo === "Entidade";

  // Links da barra pública — Entidade só vê Início, Projetos, Voluntários, Demandas
  const links = ALL_LINKS.filter((l) =>
    l.somente === "todos" || (!isEntidade && l.somente === "publico")
  );

  // Menu do dropdown conforme tipo de usuário
  const menuLogado = isEntidade
    ? [
        { href: "/projetos-admin",    label: "Projetos" },
        { href: "/voluntarios-admin", label: "Voluntários" },
        { href: "/demandas",          label: "Demandas" },
        { href: "/certificados",      label: "Lançar Certificado" },
        { href: "/eventos-admin",     label: "Eventos" },
        { href: "/entidades",         label: "Entidades" },
      ]
    : [
        { href: "/certificados",      label: "Lançar Certificado" },
        { href: "/entidades",         label: "Entidades" },
        { href: "/projetos-admin",    label: "Projetos" },
        { href: "/voluntarios-admin", label: "Voluntários" },
        { href: "/demandas",          label: "Demandas" },
        { href: "/eventos-admin",     label: "Eventos" },
        { href: "/usuarios-admin",    label: "Usuários" },
      ];

  return (
    <>
      <header className="sticky top-0 z-[100] border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-3 md:px-10 md:py-3">
          {/* Logo ConectaServir */}
          <Link
            href="/"
            className="group shrink-0 rounded-lg outline-offset-4"
            aria-label="ConectaServir — Início"
          >
            <Image
              src={CONECTASERVIR_LOGO}
              alt="ConectaServir — Unindo voluntários e projetos sociais"
              width={320}
              height={96}
              className="h-12 w-auto max-w-[200px] object-contain object-left transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:opacity-95 md:h-[68px] md:max-w-[280px]"
              priority
            />
          </Link>

          {/* Espaço flexível */}
          <div className="flex-1" />

          {/* Logo Rotary + separador + nav */}
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex shrink-0 items-center opacity-90">
              <Image
                src={ROTARY_LOGO}
                alt="Rotary Club de Pato Branco"
                width={180}
                height={64}
                className="h-[60px] w-auto object-contain md:h-[68px]"
                priority
              />
            </div>

            <span className="h-8 w-px shrink-0 bg-[#e2e8f0]" aria-hidden="true" />

            {/* Nav desktop */}
            <nav className="flex items-center gap-5" aria-label="Principal">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="whitespace-nowrap rounded-md px-1 py-0.5 text-[14px] font-medium text-[#0f172a] no-underline decoration-[#1a44a6] decoration-2 underline-offset-4 transition-all duration-200 hover:text-[#1a44a6] hover:underline"
                >
                  {label}
                </Link>
              ))}
              {!usuario ? (
                <Link
                  href="/login"
                  className="ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1a44a6] px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#153575]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Login
                </Link>
              ) : (
                <div className="relative ml-1" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1d4ed8] text-[15px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                  aria-label="Menu do usuário"
                  aria-expanded={dropdownOpen}
                >
                  {usuario.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={usuario.foto} alt={usuario.nome}
                      className="h-10 w-10 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                      }} />
                  ) : null}
                  <span
                    className="flex h-10 w-10 items-center justify-center bg-[#1d4ed8] text-[15px] font-bold text-white"
                    style={{ display: usuario.foto ? "none" : "flex" }}
                  >
                    {inicial}
                  </span>
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
                      {usuario.tipo && (
                        <p className="mt-0.5 truncate text-[11px] text-[#94a3b8]">
                          {usuario.tipo}
                        </p>
                      )}
                    </div>

                    <div style={{ borderTop: "0.5px solid #e2e8f0" }} />

                    {menuLogado.map(({ href, label }) => (
                      <div key={href}>
                        <Link
                          href={href}
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-[14px] text-[#0f172a] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                        >
                          {label}
                        </Link>
                        <div style={{ borderTop: "0.5px solid #e2e8f0" }} />
                      </div>
                    ))}

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
          </div>

          {/* Hamburguer mobile */}
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#0f172a] transition-colors hover:border-[#1a44a6]/40 hover:bg-[var(--fundo-secao)] md:hidden"
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
                    {usuario.tipo && (
                      <p className="mt-0.5 text-[11px] text-[#94a3b8]">{usuario.tipo}</p>
                    )}
                  </div>
                  {menuLogado.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="rounded-lg px-4 py-3 text-[15px] font-medium text-[#0f172a] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                      onClick={() => setOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
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
