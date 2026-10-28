import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getAdminById, getAdminCount, createAdmin } from './db';
import { AdminUser, AdminPermissions } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'tarot-sspu-super-secure-secret-key-2026-halloween-magic'
);

const CUSTOMER_JWT_SECRET = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || 'tarot-customer-session-secret-key-2026'
);

// -------------------------------------------------------------
// PASSWORD HASHING (Scrypt + Salt)
// -------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// ADMIN JWT SESSIONS
// -------------------------------------------------------------
export async function createAdminToken(admin: AdminUser): Promise<string> {
  return await new SignJWT({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub) return null;
    const admin = getAdminById(payload.sub);
    if (!admin || !admin.is_active) return null;
    return admin;
  } catch {
    return null;
  }
}

export async function getSessionAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('tarot_admin_token')?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(req: NextRequest): Promise<AdminUser | null> {
  try {
    const tokenCookie = req.cookies.get('tarot_admin_token')?.value;
    const authHeader = req.headers.get('Authorization');
    const token = tokenCookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export function checkAdminPermission(admin: AdminUser, permission?: keyof AdminPermissions): boolean {
  if (!admin.is_active) return false;
  if (admin.role === 'super_admin') return true;
  if (!permission) return true;
  return Boolean(admin[permission]);
}

// -------------------------------------------------------------
// CUSTOMER SIGNED SESSION
// -------------------------------------------------------------
export async function createCustomerToken(customerId: string, phone: string): Promise<string> {
  return await new SignJWT({
    customerId,
    phone,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(CUSTOMER_JWT_SECRET);
}

export async function verifyCustomerToken(token: string): Promise<{ customerId: string; phone: string } | null> {
  try {
    const { payload } = await jwtVerify(token, CUSTOMER_JWT_SECRET);
    if (!payload.customerId || !payload.phone) return null;
    return {
      customerId: String(payload.customerId),
      phone: String(payload.phone),
    };
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<{ customerId: string; phone: string } | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('tarot_customer_token')?.value;
    if (!token) return null;
    return await verifyCustomerToken(token);
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// BOOTSTRAP CHECK
// -------------------------------------------------------------
export function checkBootstrapNeeded(): boolean {
  return getAdminCount() === 0;
}

export function ensureSuperAdminBootstrap() {
  if (getAdminCount() === 0) {
    const envEmail = process.env.ADMIN_SUPER_EMAIL;
    const envPassword = process.env.ADMIN_SUPER_PASSWORD;
    const envName = process.env.ADMIN_SUPER_NAME || 'Lead Tarot Master';

    if (envEmail && envPassword) {
      createAdmin({
        email: envEmail,
        password_hash: hashPassword(envPassword),
        name: envName,
        role: 'super_admin',
        can_edit_prices: true,
        can_create_discounts: true,
        can_issue_refunds: true,
        can_override_queue: true,
      }, 'System Bootstrap');
      console.log(`[BOOTSTRAP] Super Admin seeded from environment: ${envEmail}`);
    }
  }
}
