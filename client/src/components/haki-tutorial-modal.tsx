"use client";

import Link from "next/link";
import { Modal, Button } from "@/components/ui";

interface HakiTutorialModalProps {
  open: boolean;
  onClose: () => void;
}

export function HakiTutorialModal({ open, onClose }: HakiTutorialModalProps) {
  function handleClose() {
    localStorage.setItem("last-island-haki-tutorial-seen", "true");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Haki Awakened">
      <div className="bg-surface-elevated rounded-xl p-6 border border-border">
        <h2 className="text-xl font-bold text-text-primary mb-3">
          🧿 Haki Awakened!
        </h2>

        <p className="text-sm text-text-secondary mb-4">
          Your victories have earned you <strong className="text-text-primary">Haki Points</strong>.
          Spend them to unlock powerful combat abilities that can turn the tide of battle!
        </p>

        <ul className="space-y-3 mb-5">
          <li className="flex items-start gap-2">
            <span className="text-lg">👁</span>
            <div>
              <span className="text-blue-400 font-semibold">Observation</span>
              <p className="text-xs text-text-muted">
                Reveals enemy ship positions during battle
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">🦾</span>
            <div>
              <span className="text-red-400 font-semibold">Armament</span>
              <p className="text-xs text-text-muted">
                Strengthens your cannonballs with counter-fire
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">👑</span>
            <div>
              <span className="text-purple-400 font-semibold">Conqueror&apos;s</span>
              <p className="text-xs text-text-muted">
                Unleashes an X-pattern attack on the field
              </p>
            </div>
          </li>
        </ul>

        <Link href="/haki">
          <Button variant="primary" fullWidth>
            Manage Your Haki →
          </Button>
        </Link>

        <p className="text-xs text-text-muted text-center mt-3">
          You can always access this from the 👁 icon in the header.
        </p>
      </div>
    </Modal>
  );
}
