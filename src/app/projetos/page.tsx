import type { Metadata } from "next";
import { ProjetoForm } from "@/components/ProjetoForm";

export const metadata: Metadata = {
  title: "Cadastre seu projeto",
};

export default function ProjetosPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--fundo-secao)] px-6 pb-16 pt-16 lg:px-16">
      <div className="mx-auto w-full max-w-[680px]">
        <h1 className="font-heading text-center text-[40px] leading-tight text-[#1a2e44]">
          Cadastre seu projeto
        </h1>
        <p className="mb-10 mt-3 text-center text-base leading-relaxed text-[#475569]">
          Preencha os dados da sua iniciativa social
        </p>
        <ProjetoForm />
      </div>
    </main>
  );
}
