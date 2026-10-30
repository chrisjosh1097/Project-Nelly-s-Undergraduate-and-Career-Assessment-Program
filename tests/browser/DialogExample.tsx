import { useState } from "react";
import { ConfirmDialog } from "../../src/components/ui/ConfirmDialog";
export function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Ouvrir</button>
      <ConfirmDialog
        open={open}
        title="Konfirmasi"
        confirmLabel="Kirim"
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      >
        Satu kesempatan.
      </ConfirmDialog>
    </>
  );
}
