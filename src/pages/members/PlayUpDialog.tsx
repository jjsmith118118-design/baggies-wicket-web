import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Child } from "@/lib/members";
import { JUNIOR_EMAIL } from "@/config/club";

/** Small link that opens the "playing in an older age group" confirmation. */
export function PlayUpLink({ child, group, onChanged }: { child: Child; group: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("children").update({ plays_up: true }).eq("id", child.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${child.first_name} is set to play in an older age group`);
    setOpen(false);
    onChanged();
  };

  return (
    <>
      <button type="button" onClick={() => { setAgreed(false); setOpen(true); }}
              className="text-sm text-primary underline underline-offset-2 hover:no-underline">
        Playing in an older age group?
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Is {child.first_name} playing up?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {child.first_name} is in {group} by age, which is booked through the ECB. Some children play in an older
                  age group instead, but only when a coach agrees it's right for them.
                </p>
                <p>
                  If {child.first_name} is playing up, they'll need club junior membership rather than {group}.
                  Not sure? <a href={`mailto:${JUNIOR_EMAIL}?subject=${encodeURIComponent(`Playing up: ${child.first_name}`)}`}
                     className="text-primary underline underline-offset-2">Ask our junior coordinator</a> first.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-md border border-border p-4">
            <Checkbox id="playup-agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <Label htmlFor="playup-agree" className="font-normal leading-snug">
              A KBCC coach or the junior coordinator has agreed {child.first_name} can play in an older age group.
            </Label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={confirm} disabled={!agreed || saving}>
              {saving && <Loader2 className="animate-spin" />}Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Undo link for a child who is playing up (only offered before they've paid). */
export function StopPlayingUpLink({ child, group, onChanged }: { child: Child; group: string; onChanged: () => void }) {
  const undo = async () => {
    if (!supabase) return;
    if (!window.confirm(`Move ${child.first_name} back to ${group}? ${group} is booked through the ECB.`)) return;
    const { error } = await supabase.from("children").update({ plays_up: false }).eq("id", child.id);
    if (error) return toast.error(error.message);
    onChanged();
  };
  return (
    <button type="button" onClick={undo} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
      Not playing up?
    </button>
  );
}
