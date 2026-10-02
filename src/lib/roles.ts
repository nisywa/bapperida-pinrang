/**
 * Empat peran pada sistem. MASYARAKAT menggunakan portal publik tanpa akun,
 * sedangkan tiga peran internal menggunakan backoffice dan sesi autentikasi.
 */
export const SYSTEM_ROLES = ["ADMIN", "BAPPERIDA", "OPD", "MASYARAKAT"] as const;
export const INTERNAL_ROLES = ["ADMIN", "BAPPERIDA", "OPD"] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];
export type InternalRole = (typeof INTERNAL_ROLES)[number];

export function isInternalRole(value: string): value is InternalRole {
  return (INTERNAL_ROLES as readonly string[]).includes(value);
}

