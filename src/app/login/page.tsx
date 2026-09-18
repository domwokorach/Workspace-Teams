import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/login-screen";

export const metadata = { title: "Sign in · Engineering Workspace" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}
