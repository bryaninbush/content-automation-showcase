export type Role = "owner" | "editor" | "viewer";

export type Permission =
  | "member:manage"
  | "client:read"
  | "client:write"
  | "knowledge:read"
  | "knowledge:write"
  | "job:read"
  | "job:create"
  | "job:update"
  | "settings:manage";

export type JobStatus =
  | "queued"
  | "in_progress"
  | "waiting_review"
  | "done"
  | "failed";

export type KnowledgeType =
  | "brand-context"
  | "product-info"
  | "target-audience"
  | "writing-style";

export interface AuthenticatedUser {
  email: string;
  googleSub: string;
  displayName?: string;
}

export interface Membership {
  organizationId: string;
  role: Role;
}

export interface ContentJobPayload {
  clientId: string;
  requestedBy: string;
  scope: "non-product" | "all" | "selected";
  rows?: number[];
  notes?: string;
}

const permissionsByRole: Record<Role, Set<Permission>> = {
  owner: new Set([
    "member:manage",
    "client:read",
    "client:write",
    "knowledge:read",
    "knowledge:write",
    "job:read",
    "job:create",
    "job:update",
    "settings:manage"
  ]),
  editor: new Set([
    "client:read",
    "client:write",
    "knowledge:read",
    "knowledge:write",
    "job:read",
    "job:create",
    "job:update"
  ]),
  viewer: new Set(["client:read", "knowledge:read", "job:read"])
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissionsByRole[role].has(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} does not have permission ${permission}`);
  }
}

export function parseIapEmail(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const [, email] = headerValue.split(":");
  return (email ?? headerValue).trim().toLowerCase();
}

export function parseIapSubject(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const [, subject] = headerValue.split(":");
  return (subject ?? headerValue).trim();
}

export function isValidJobStatus(value: string): value is JobStatus {
  return ["queued", "in_progress", "waiting_review", "done", "failed"].includes(value);
}

export function normalizeKnowledgeType(value: string): KnowledgeType {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "brand-context" ||
    normalized === "product-info" ||
    normalized === "target-audience" ||
    normalized === "writing-style"
  ) {
    return normalized;
  }
  throw new Error(`Unsupported knowledge type: ${value}`);
}
