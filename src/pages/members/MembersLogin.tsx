import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

const MembersLogin = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/members` },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="min-h-[70vh] bg-muted/40 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <img
          src="/images/logo-160.png"
          alt="Kingston Bagpuize CC"
          className="h-20 w-20 mx-auto mb-6"
        />
        <h1 className="text-3xl font-bold text-center mb-2">Members area</h1>
        <p className="text-center text-muted-foreground mb-8">
          Pay subs, buy club kit and see everything you've paid for.
        </p>

        <Card>
          <CardContent className="pt-6">
            {status === "sent" ? (
              <div className="text-center py-4" role="status">
                <MailCheck className="h-10 w-10 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Check your email</h2>
                <p className="text-muted-foreground">
                  We've sent a login link to <strong className="text-foreground">{email}</strong>. Open it on this
                  device to sign in.
                </p>
                <Button variant="link" className="mt-4" onClick={() => setStatus("idle")}>
                  Use a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={sendLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Your email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={status === "sending"}>
                  {status === "sending" && <Loader2 className="animate-spin" />}
                  Email me a login link
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  No password needed. New to the club? The same link creates your account.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembersLogin;
