import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CompanyFormDialog } from "@/components/app/companies/company-form-dialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import "../../../src/styles.css";

export function Fixture() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-card lg:block">CYLOO sidebar</aside>
      <main className="min-h-[200vh] p-8 lg:ml-64">
        <Button onClick={() => setOpen(true)}>New company</Button>
        <CompanyFormDialog open={open} onOpenChange={setOpen} />
      </main>
      <Toaster />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
