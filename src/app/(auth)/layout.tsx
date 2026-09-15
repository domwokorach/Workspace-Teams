import { Code2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-2 text-foreground">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Code2 className="size-5" />
          </div>
          <span className="font-mono text-lg font-semibold tracking-tight">
            engineering-workspace
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
