import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="flex gap-2">
        {reset ? (
          <Button variant="outline" size="sm" onClick={() => reset()}>
            Try again
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={() => {
            router.navigate({ to: "/" });
          }}
        >
          Go home
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to="/" />}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
