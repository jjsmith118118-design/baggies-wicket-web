import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Child } from "@/lib/members";
import { CURRENT_SEASON } from "@/config/club";

async function setBooked(child: Child, booked: boolean) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("children")
    .update({ ecb_booked_season: booked ? CURRENT_SEASON : null })
    .eq("id", child.id);
  if (error) {
    toast.error(error.message);
    return false;
  }
  return true;
}

/** "I've booked" button for parents, once they've booked on the ECB site. */
export function MarkEcbBooked({ child, group, onChanged }: { child: Child; group: string; onChanged: () => void }) {
  return (
    <button
      type="button"
      className="inline-block py-1.5 text-sm text-primary underline underline-offset-2 hover:no-underline"
      onClick={async () => {
        if (!window.confirm(`Have you booked and paid for ${child.first_name}'s ${CURRENT_SEASON} ${group} course on the ECB website?`)) return;
        if (await setBooked(child, true)) {
          toast.success(`Thanks! ${child.first_name} is marked as booked`);
          onChanged();
        }
      }}
    >
      I've already booked
    </button>
  );
}

/** Shown once booked, with a small undo. */
export function EcbBookedNote({ child, onChanged }: { child: Child; onChanged: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex items-center gap-2 text-green-700 font-medium">
        <CheckCircle2 className="h-5 w-5" /> Booked with the ECB for {CURRENT_SEASON}
      </span>
      <button
        type="button"
        className="inline-block py-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        onClick={async () => {
          if (!window.confirm(`Mark ${child.first_name} as not booked?`)) return;
          if (await setBooked(child, false)) onChanged();
        }}
      >
        Not booked?
      </button>
    </div>
  );
}
