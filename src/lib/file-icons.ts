import {
  FileCode2,
  FileJson,
  FileText,
  FileType,
  Braces,
  Palette,
  Image as ImageIcon,
  Settings2,
  Folder,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";

const EXT_ICON: Record<string, LucideIcon> = {
  ts: FileCode2,
  tsx: FileCode2,
  js: FileCode2,
  jsx: FileCode2,
  py: FileCode2,
  go: FileCode2,
  rs: FileCode2,
  java: FileCode2,
  cs: FileCode2,
  cpp: FileCode2,
  c: FileCode2,
  json: FileJson,
  md: FileText,
  mdx: FileText,
  yml: Settings2,
  yaml: Settings2,
  css: Palette,
  scss: Palette,
  html: Braces,
  png: ImageIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
  svg: ImageIcon,
  gif: ImageIcon,
};

export function iconForFile(name: string): LucideIcon {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_ICON[ext] ?? FileType;
}

export const FolderIcon = Folder;
export const FolderOpenIcon = FolderOpen;

const EXT_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  html: "html",
  css: "css",
  scss: "scss",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  cs: "csharp",
  cpp: "cpp",
  c: "c",
  md: "markdown",
  mdx: "markdown",
  yml: "yaml",
  yaml: "yaml",
};

export function languageForFile(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANGUAGE[ext] ?? "plaintext";
}
