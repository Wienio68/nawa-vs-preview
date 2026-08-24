import { createFileRoute } from "@tanstack/react-router";
import { NawaApp } from "@/components/nawa/NawaApp.tsx";
import { NawaProvider } from "@/components/nawa/NawaProvider.tsx";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <NawaProvider>
      <NawaApp />
    </NawaProvider>
  );
}
