"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/shared/types/product";
import type { SelectedModifier } from "@/shared/types/cart";
import { ModifierGroupSelector } from "./ModifierGroup";
import { formatCents } from "@/shared/utils/money";

interface Props {
  product: Product;
  onConfirm: (modifiers: SelectedModifier[]) => void;
  onClose: () => void;
}

export function ModifierModal({ product, onConfirm, onClose }: Props) {
  const [selections, setSelections] = useState<SelectedModifier[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Keep a ref to the latest onClose so the listener never needs to re-subscribe.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Open the native dialog and wire up the browser's built-in close event
  // (fired on Escape as well as programmatic dialog.close()).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const handler = () => onCloseRef.current();
    dialog.addEventListener("close", handler);
    return () => dialog.removeEventListener("close", handler);
  }, []); // empty deps — subscribe once, handler ref always points to latest

  function handleGroupChange(groupId: string, mods: SelectedModifier[]) {
    setSelections((prev) => [
      ...prev.filter((s) => s.groupId !== groupId),
      ...mods,
    ]);
  }

  const modifierTotal = selections.reduce((sum, mod) => sum + mod.priceInCents, 0);
  const total = product.basePriceInCents + modifierTotal;

  const requiredGroups = product.modifierGroups.filter((g) => g.required);
  const allRequiredMet = requiredGroups.every(
    (g) => selections.filter((s) => s.groupId === g.id).length >= g.min,
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-md mx-auto rounded-2xl shadow-2xl p-0 max-h-[90vh] flex flex-col backdrop:bg-black/50 open:flex"
    >
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{product.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable modifier list */}
      <div className="overflow-y-auto p-5 flex-1">
        {product.modifierGroups.map((group) => (
          <ModifierGroupSelector
            key={group.id}
            group={group}
            selected={selections.filter((s) => s.groupId === group.id)}
            onChange={(mods) => handleGroupChange(group.id, mods)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-5 border-t">
        <button
          type="button"
          onClick={() => allRequiredMet && onConfirm(selections)}
          disabled={!allRequiredMet}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Add to Cart ({formatCents(total)})
        </button>
      </div>
    </dialog>
  );
}
