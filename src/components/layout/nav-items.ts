import {
  LayoutDashboard,
  MessageSquare,
  FolderGit2,
  CircleDot,
  GitPullRequest,
  Code2,
  FlaskConical,
  Users,
  Video,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Repositories", href: "/repositories", icon: FolderGit2 },
  { label: "Issues", href: "/issues", icon: CircleDot },
  { label: "Pull Requests", href: "/pull-requests", icon: GitPullRequest },
  { label: "Code", href: "/repositories", icon: Code2 },
  { label: "Tests / CI", href: "/tests", icon: FlaskConical },
  { label: "Contributors", href: "/contributors", icon: Users },
  { label: "Video Calls", href: "/calls", icon: Video },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Code", href: "/repositories", icon: Code2 },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "GitHub", href: "/repositories/find", icon: FolderGit2 },
  { label: "Profile", href: "/settings", icon: Settings },
];
