import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function AuthView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    if (error) {
      setError(error.message || "Unable to send sign-in email");
    } else {
      setOtp("");
      setSent(true);
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signIn.emailOtp({
      email,
      otp,
    });

    if (error) {
      setError(error.message || "Invalid sign-in code");
      setLoading(false);
      return;
    }

    await router.invalidate();
  };

  const handleResend = async () => {
    setError(null);
    setLoading(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    if (error) {
      setError(error.message || "Unable to resend sign-in email");
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          We sent a sign-in code and link to{" "}
          <span className="font-medium">{email}</span>. Enter the code below, or
          click the link in the email.
        </p>
        <form onSubmit={handleVerifyOtp}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="otp">Sign-in code</FieldLabel>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="text-center text-lg tracking-widest"
              />
            </Field>
            <Field>
              <Button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign in with code"}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </Field>
            <Field>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="w-full"
                onClick={handleResend}
              >
                Resend email
              </Button>
            </Field>
            <Field>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSent(false);
                  setOtp("");
                  setError(null);
                }}
              >
                Use a different email
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2 text-center">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-4 text-center">
        Enter your email and we&apos;ll send you a sign-in code and link
      </p>
      <form onSubmit={handleSendCode}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </Field>
          <Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send sign-in email"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
