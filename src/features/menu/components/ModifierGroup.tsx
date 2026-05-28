"use client";

import type { ModifierGroup as MG, ModifierOption } from "@/shared/types/product";
import type { SelectedModifier } from "@/shared/types/cart";
import { formatCents } from "@/shared/utils/money";

interface Props {
  group: MG;
  selected: SelectedModifier[];
  onChange: (selections: SelectedModifier[]) => void;
}

export function ModifierGroupSelector({ group, selected, onChange }: Props) {
  const selectedIds = selected.map((s) => s.optionId);

  function handleChange(option: ModifierOption, checked: boolean) {
    if (group.max === 1) {
      onChange(
        checked
          ? [{ groupId: group.id, optionId: option.id, name: option.name, priceInCents: option.priceInCents }]
          : [],
      );
    } else {
      if (checked) {
        const next: SelectedModifier[] = [
          ...selected,
          { groupId: group.id, optionId: option.id, name: option.name, priceInCents: option.priceInCents },
        ];
        onChange(next.slice(0, group.max));
      } else {
        onChange(selected.filter((s) => s.optionId !== option.id));
      }
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-gray-800">{group.name}</span>
        {group.required && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            Required
          </span>
        )}
        {group.max > 1 && (
          <span className="text-xs text-gray-400">Pick up to {group.max}</span>
        )}
      </div>
      <div className="space-y-1.5">
        {group.options.map((option) => {
          const checked = selectedIds.includes(option.id);
          const inputType = group.max === 1 ? "radio" : "checkbox";
          return (
            <label
              key={option.id}
              className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:border-orange-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <input
                  type={inputType}
                  name={group.id}
                  id={`${group.id}-${option.id}`}
                  checked={checked}
                  onChange={(e) => handleChange(option, e.target.checked)}
                  className="accent-orange-500"
                  aria-label={option.name}
                />
                <span className="text-sm text-gray-700">{option.name}</span>
              </div>
              {option.priceInCents > 0 && (
                <span className="text-sm text-gray-500">
                  +{formatCents(option.priceInCents)}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
