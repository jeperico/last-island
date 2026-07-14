"use client";

import { Modal, Button } from "@/components/ui";

interface SurrenderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function SurrenderModal({
  open,
  onClose,
  onConfirm,
  loading,
}: SurrenderModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Surrender?">
      <div className="rounded-lg border border-border bg-surface-elevated p-6 text-center">
        <span className="text-4xl">🏳️</span>
        <h3 className="mt-3 text-lg font-bold text-foreground">Surrender?</h3>
        <p className="mt-2 text-sm text-text-muted">
          This battle will be recorded as a defeat. Your opponent wins by
          walkover.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Surrender
          </Button>
        </div>
      </div>
    </Modal>
  );
}
