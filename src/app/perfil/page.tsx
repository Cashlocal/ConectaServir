"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = { id: string; nome: string; email: string };

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) {
        router.replace("/login");
        return;
      }
      setUsuario(JSON.parse(raw));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!usuario) return null;

  const inicial = usuario.nome?.charAt(0).toUpperCase() ?? "?";

  return (
    <main className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-[#eff6ff] px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="rounded-2xl border border-[#bfdbfe] bg-white p-10 text-center shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
          {/* Avatar */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#1d4ed8] text-3xl font-bold text-white shadow-[0_4px_16px_rgba(29,78,216,0.25)]">
            {inicial}
          </div>

          <h1
            className="text-2xl font-bold text-[#1e3a8a]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {usuario.nome}
          </h1>
          <p className="mt-1 text-[15px] text-[#64748b]">{usuario.email}</p>

          <div
            className="my-6"
            style={{ borderTop: "0.5px solid #e2e8f0" }}
          />

          <p className="text-[14px] text-[#94a3b8]">
            Mais informações do perfil em breve.
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1a44a6] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#153575]"
          >
            Ir para o início
          </button>
        </div>
      </div>
    </main>
  );
}
