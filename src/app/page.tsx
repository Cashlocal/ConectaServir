import Image from "next/image";
import Link from "next/link";
import {
  HERO_VOLUNTEERS_IMAGE_URL,
  REDE_GLOBAL_IMAGE_URL,
} from "@/lib/heroVoluntariosImage";

const cards = [
  {
    icon: "🤝",
    title: "Conecte Pessoas",
    text: "Encontre voluntários apaixonados ou projetos que precisam de sua ajuda em poucos cliques.",
  },
  {
    icon: "⚡",
    title: "Simples e Rápido",
    text: "Cadastre seu projeto ou perfil em minutos. Sem burocracias, apenas o essencial.",
  },
  {
    icon: "🌱",
    title: "Faça a Diferença",
    text: "Contribua para projetos sociais que impactam comunidades e transformam vidas.",
  },
];

const redeBullets: { text: string; dotClass: string }[] = [
  {
    text: "Conecte-se com projetos que compartilham seus valores",
    dotClass: "text-[#1a44a6]",
  },
  {
    text: "Encontre voluntários dedicados para sua causa",
    dotClass: "text-[#d97706]",
  },
  {
    text: "Acompanhe o impacto de suas ações",
    dotClass: "text-[#1a44a6]",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero — azul mais escuro e ilustração Manus CDN */}
      <section
        className="bg-[var(--fundo-secao)] px-6 py-20 lg:px-16"
        dir="ltr"
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-10 lg:gap-16">
          <div className="min-w-0 max-w-xl flex-1 md:pr-4">
            <h1 className="font-heading text-center text-4xl leading-[1.15] text-[#1a2e44] md:text-left md:text-[2.75rem] md:leading-[1.15]">
              Conecte voluntários a projetos sociais
            </h1>
            <p className="mt-4 max-w-xl text-center text-lg font-normal leading-relaxed text-[#4a5e6a] antialiased md:text-left">
              Uma plataforma simples e poderosa para conectar pessoas
              apaixonadas por fazer a diferença com projetos que precisam de
              ajuda.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:justify-start">
              <Link
                href="/projetos"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a44a6] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#153575]"
              >
                Conhecer Projetos
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/voluntarios"
                className="inline-flex w-full items-center justify-center rounded-lg border-2 border-[#1a44a6] bg-white px-6 py-3 text-base font-medium text-[#1a44a6] transition-colors hover:bg-[#eef3fc]"
              >
                Ser Voluntário
              </Link>
              <Link
                href="/consultar-demandas"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#d97706] bg-white px-6 py-3 text-base font-medium text-[#d97706] transition-colors hover:bg-[#fffbeb]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
                </svg>
                Consultar Demandas
              </Link>
              <Link
                href="/eventos"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#16a34a] bg-white px-6 py-3 text-base font-medium text-[#16a34a] transition-colors hover:bg-[#f0fdf4]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Calendário de Eventos
              </Link>
            </div>
          </div>
          <div className="relative w-full shrink-0 overflow-hidden rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-shadow duration-300 ease-out hover:shadow-[0_12px_40px_rgba(26,68,166,0.18)] md:w-[min(100%,520px)] md:max-w-[52%] lg:max-w-[520px]">
            <Image
              src={HERO_VOLUNTEERS_IMAGE_URL}
              alt="Ilustração de voluntários colaborando em projetos sociais"
              width={1200}
              height={900}
              className="h-[240px] w-full rounded-3xl object-cover object-center transition-transform duration-500 ease-out hover:scale-[1.02] motion-reduce:transition-none md:h-[300px] lg:h-[380px]"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* Por que ConectaServir */}
      <section className="bg-[var(--fundo-secao)] px-6 py-20 lg:px-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-heading mb-12 text-center text-4xl text-[#1a2e44] md:text-[2.25rem]">
            Por que ConectaServir?
          </h2>
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ icon, title, text }) => (
              <li
                key={title}
                className="group rounded-2xl border border-white/60 bg-white p-8 shadow-[0_2px_16px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#1a44a6]/25 hover:shadow-[0_16px_48px_rgba(26,68,166,0.14)] motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span
                  className="inline-block text-3xl transition-transform duration-300 ease-out group-hover:scale-110 motion-reduce:transform-none"
                  aria-hidden
                >
                  {icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-[#0f172a] transition-colors duration-200 group-hover:text-[#1a44a6]">
                  {title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#475569]">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Rede global — imagem à esquerda, texto à direita (como o modelo) */}
      <section className="bg-white px-6 py-20 lg:px-16" dir="ltr">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 md:flex-row md:items-center md:gap-12 lg:gap-16">
          <div className="w-full min-w-0 md:flex-1 md:basis-1/2">
            <div className="group/rede rounded-3xl bg-white p-2 shadow-[0_8px_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(26,68,166,0.12)] hover:ring-[#1a44a6]/20 motion-reduce:transform-none">
              <div
                className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl"
                style={{
                  background:
                    "radial-gradient(ellipse 85% 75% at 50% 35%, #e4edf8 0%, #f0f5fc 40%, #ffffff 100%)",
                }}
              >
                <div className="absolute inset-4 sm:inset-6 md:inset-8">
                  <div className="relative h-full w-full">
                    <Image
                      src={REDE_GLOBAL_IMAGE_URL}
                      alt="Rede de impacto social — projetos e conexões"
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-contain object-center transition-transform duration-500 ease-out group-hover/rede:scale-[1.03] motion-reduce:transition-none"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="min-w-0 md:flex-1 md:basis-1/2 md:pl-2 lg:pl-4">
            <h2 className="font-heading text-left text-4xl leading-tight text-[#1a2e44] lg:text-[2.25rem]">
              Uma rede global de impacto social
            </h2>
            <p className="mt-4 max-w-xl text-left text-base leading-relaxed text-[#4a5e6a]">
              ConectaServir une voluntários e projetos sociais em uma plataforma
              colaborativa. Cada conexão é uma oportunidade de transformar
              comunidades e criar impacto duradouro.
            </p>
            <ul className="mt-6 space-y-3">
              {redeBullets.map(({ text, dotClass }) => (
                <li
                  key={text}
                  className="flex gap-3 text-left text-[15px] leading-snug text-[#0f172a]"
                >
                  <span className={`shrink-0 ${dotClass}`} aria-hidden>
                    ●
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#1a44a6] px-6 py-20 text-center lg:px-16">
        <div className="mx-auto max-w-[720px]">
          <h2 className="font-heading text-4xl text-white md:text-[2.25rem]">
            Pronto para fazer a diferença?
          </h2>
          <p className="my-4 mb-8 text-lg leading-relaxed text-white/85">
            Cadastre seu projeto social ou seu perfil de voluntário e comece a
            conectar-se com pessoas que compartilham sua paixão por ajudar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/projetos"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3 text-base font-semibold text-[#1a44a6] transition-opacity hover:opacity-95"
            >
              Conhecer Projetos
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/voluntarios"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Cadastrar como Voluntário
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
