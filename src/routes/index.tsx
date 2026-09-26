import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthView } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { checkBindingsFn } from "@/server/health";
import { getSessionFn } from "@/server/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Starter" }],
  }),
  ssr: true,
  loader: async () => {
    const session = await getSessionFn();
    return { session };
  },
  component: HomePage,
});

function HomePage() {
  const { session } = Route.useLoaderData();

  if (!session?.user) {
    return <AuthView />;
  }

  return <SignedInHome user={session.user} />;
}

function SignedInHome({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [bindings, setBindings] = useState<{
    d1: boolean;
    r2: boolean;
  } | null>(null);
  const [bindingsError, setBindingsError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    await router.invalidate();
  };

  const handleCheckBindings = async () => {
    setChecking(true);
    setBindingsError(null);
    try {
      const result = await checkBindingsFn();
      setBindings(result);
    } catch (error) {
      setBindings(null);
      setBindingsError(
        error instanceof Error ? error.message : "Bindings check failed",
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Signed in</h1>
        <p className="text-sm text-muted-foreground">
          {user.name || user.email}
        </p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          disabled={checking}
          onClick={handleCheckBindings}
        >
          {checking ? "Checking…" : "Check D1 + R2 bindings"}
        </Button>
        {bindings ? (
          <p className="text-sm text-muted-foreground">
            D1: {bindings.d1 ? "ok" : "fail"} · R2:{" "}
            {bindings.r2 ? "ok" : "fail"}
          </p>
        ) : null}
        {bindingsError ? (
          <p className="text-sm text-destructive">{bindingsError}</p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="secondary"
        disabled={signingOut}
        onClick={handleSignOut}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
