import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <div className="flex gap-2">
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
