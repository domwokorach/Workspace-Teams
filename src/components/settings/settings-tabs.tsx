"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "./profile-settings";
import { GitHubSettings } from "./github-settings";
import { AppearanceSettings } from "./appearance-settings";
import { SecuritySettings } from "./security-settings";
import { SessionsSettings } from "./sessions-settings";
import type { CurrentUser } from "@/lib/auth/session";

export function SettingsTabs({
  user,
  github,
}: {
  user: CurrentUser;
  github: { username: string; connectedAt: string } | null;
}) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "profile";

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="flex-wrap">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="github">GitHub</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
      </TabsList>
      <TabsContent value="profile"><ProfileSettings user={user} /></TabsContent>
      <TabsContent value="github"><GitHubSettings github={github} /></TabsContent>
      <TabsContent value="appearance"><AppearanceSettings /></TabsContent>
      <TabsContent value="security"><SecuritySettings /></TabsContent>
      <TabsContent value="sessions"><SessionsSettings /></TabsContent>
    </Tabs>
  );
}
