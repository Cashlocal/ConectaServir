import Link from "next/link";

const colClass =
  "text-[13px] font-bold uppercase tracking-[0.08em] text-white";

const linkClass =
  "block text-sm font-normal text-white/70 transition-colors hover:text-white";

export function Footer() {
  return (
    <footer className="bg-[#0f172a] px-6 py-12 text-white lg:px-16">
      <div className="mx-auto grid max-w-[1200px] gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div>
          <p className="text-base font-bold tracking-tight text-white">
            ConectaServir
          </p>
          <p className="mt-3 max-w-xs text-sm font-normal leading-relaxed text-white/60">
            Unindo voluntários e projetos sociais para criar impacto global.
          </p>
        </div>
        <div>
          <h3 className={colClass}>Plataforma</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/projetos" className={linkClass}>
                Projetos
              </Link>
            </li>
            <li>
              <Link href="/voluntarios" className={linkClass}>
                Voluntários
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className={colClass}>Sobre</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="#" className={linkClass}>
                Sobre nós
              </Link>
            </li>
            <li>
              <Link href="#" className={linkClass}>
                Contato
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className={colClass}>Legal</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="#" className={linkClass}>
                Privacidade
              </Link>
            </li>
            <li>
              <Link href="#" className={linkClass}>
                Termos
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1200px] border-t border-white/10 pt-8">
        <p className="text-center text-[13px] font-normal text-white/40">
          © 2026 ConectaServir. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
