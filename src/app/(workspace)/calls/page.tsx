import { Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CallsPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Video Calls</h1>
        <p className="text-sm text-muted-foreground">WebRTC video calling for your workspace.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Video className="size-10 text-muted-foreground" />
          <p className="font-medium">Video calling is being built</p>
          <p className="max-w-md text-sm text-muted-foreground">
            The <code className="font-mono">VideoRoom</code> and <code className="font-mono">VideoParticipant</code>{" "}
            data models and workspace routing are already in place. WebRTC peer connections, a signalling server, and
            screen-share controls land in the next update — this page will let you start or join a call once that
            ships.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
