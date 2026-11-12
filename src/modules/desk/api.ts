import { ApiError } from "@/modules/identity/api";
import { apiFetch } from "@/lib/apiFetch";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { res, json } = await apiFetch<T>(path, options);
  if (!res.ok || (json as { success?: boolean }).success === false) {
    const err = json as { error?: { message?: string }; message?: string };
    throw new ApiError(err.error?.message || err.message || "Request failed");
  }
  return json as T;
}

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export type DeskBoard = {
  jobsToday: number;
  city: string;
  commissionKeptPkr: number;
  packageIncomePkr: number;
  referralPaidPkr: number;
  companyNetPassivePkr: number;
  payoutPendingPkr: number;
  experts: number;
  onlineExperts: number;
  shops: number;
  liveShops: number;
  heldShops: number;
  openJobs: number;
  inProgressJobs: number;
  receiptsToday: number;
  packages: Record<string, number>;
  jobsSeries: Array<{
    day: string;
    jobs: number;
    commission: number;
    volume?: number;
    signups?: number;
    ledgerIn?: number;
  }>;
  jobStatusMix: Array<{ label: string; value: number }>;
  railMix: Array<{ label: string; value: number; commission: number }>;
  incomeMix: Array<{ label: string; amount: number }>;
  rates: Record<string, number>;
  note: string;
};

export type DeskJob = {
  id: string;
  status: string;
  quotation: number;
  visitFee: number;
  commission: number;
  netToWorker: number;
  currency: string;
  rail: string | null;
  createdAt: string;
  completedAt: string | null;
  asker: { id: string; name: string };
  worker: { id: string; name: string; package: string };
  receipt: DeskReceipt | null;
};

export type DeskLedgerLine = {
  id: string;
  kind: string;
  rail: string | null;
  amount: number;
  currency: string;
  note: string | null;
  createdAt: string;
  account: { id: string; name: string; email: string } | null;
  job: {
    id: string;
    asker: { name: string };
    worker: { name: string };
  } | null;
};

export type DeskReceipt = {
  id: string;
  receiptNo: string;
  jobId: string;
  askerId: string;
  workerId: string;
  askerName: string;
  workerName: string;
  quotation: number;
  visitFee: number;
  total: number;
  packageRate: number;
  commission: number;
  netToWorker: number;
  currency: string;
  rail: string;
  payNote: string | null;
  packageTier: string | null;
  createdAt: string;
};

export type DeskActivity = {
  jobs: Array<{
    id: string;
    status: string;
    quotation: number;
    visitFee: number;
    currency: string;
    updatedAt: string;
    asker: { name: string };
    worker: { name: string };
  }>;
  lines: Array<{
    id: string;
    kind: string;
    amount: number;
    currency: string;
    note: string | null;
    createdAt: string;
    account: { name: string } | null;
  }>;
  receipts: DeskReceipt[];
  shops: Array<{
    id: string;
    name: string;
    status: string;
    updatedAt: string;
    owner: { name: string };
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    kind: string;
    createdAt: string;
    account: { name: string };
  }>;
  contacts: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
    email: string | null;
    name: string;
    city: string | null;
    message: string;
    deskInbox: string;
  }>;
};

export type DeskContact = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  email: string | null;
  name: string;
  city: string | null;
  country?: string | null;
  subject?: string | null;
  message: string;
  preview?: string;
  deskNote?: string | null;
  deskInbox: string;
  kind?: "CONTACT" | "COMPLAINT";
  status?: "OPEN" | "READ" | "IN_PROGRESS" | "CLOSED";
  readAt?: string | null;
  closedAt?: string | null;
  updatedAt?: string;
};

export const deskApi = {
  board() {
    return request<{ success: boolean; data: { board: DeskBoard } }>("/api/desk/board");
  },
  activity() {
    return request<{ success: boolean; data: { activity: DeskActivity } }>(
      "/api/desk/activity",
    );
  },
  contacts(
    page = 1,
    pageSize = 30,
    filters: { kind?: string; status?: string; q?: string } = {},
  ) {
    return request<{
      success: boolean;
      data: { total: number; page: number; pageSize: number; contacts: DeskContact[] };
    }>(
      `/api/desk/contacts${qs({
        page,
        pageSize,
        kind: filters.kind,
        status: filters.status,
        q: filters.q,
      })}`,
    );
  },
  contact(id: string) {
    return request<{ success: boolean; data: { contact: DeskContact } }>(
      `/api/desk/contacts/${id}`,
    );
  },
  updateContact(
    id: string,
    body: { status?: "OPEN" | "READ" | "IN_PROGRESS" | "CLOSED"; deskNote?: string },
  ) {
    return request<{ success: boolean; data: { contact: DeskContact } }>(
      `/api/desk/contacts/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
  },
  experts(
    page = 1,
    pageSize = 20,
    filters: { q?: string; package?: string; online?: boolean } = {},
  ) {
    return request<{
      success: boolean;
      data: {
        total: number;
        page: number;
        pageSize: number;
        experts: Array<{
          id: string;
          name: string;
          work: string | null;
          placeLabel: string | null;
          package: string;
          rating: number;
          ratingCount?: number;
          isOnline: boolean;
        }>;
      };
    }>(
      `/api/desk/experts${qs({
        page,
        pageSize,
        q: filters.q,
        package: filters.package,
        online:
          filters.online === undefined ? undefined : filters.online ? "true" : "false",
      })}`,
    );
  },
  shops(page = 1, pageSize = 20, filters: { q?: string; status?: string } = {}) {
    return request<{
      success: boolean;
      data: {
        total: number;
        page: number;
        pageSize: number;
        shops: Array<{
          id: string;
          name: string;
          status: string;
          heldReason: string | null;
          owner: { name: string };
        }>;
      };
    }>(`/api/desk/shops${qs({ page, pageSize, q: filters.q, status: filters.status })}`);
  },
  jobs(page = 1, pageSize = 20, filters: { q?: string; status?: string } = {}) {
    return request<{
      success: boolean;
      data: { total: number; page: number; pageSize: number; jobs: DeskJob[] };
    }>(`/api/desk/jobs${qs({ page, pageSize, q: filters.q, status: filters.status })}`);
  },
  ledger(
    page = 1,
    pageSize = 25,
    filters: { q?: string; kind?: string; rail?: string } = {},
  ) {
    return request<{
      success: boolean;
      data: { total: number; page: number; pageSize: number; lines: DeskLedgerLine[] };
    }>(
      `/api/desk/ledger${qs({
        page,
        pageSize,
        q: filters.q,
        kind: filters.kind,
        rail: filters.rail,
      })}`,
    );
  },
  receipts(page = 1, pageSize = 20, q?: string) {
    return request<{
      success: boolean;
      data: { total: number; page: number; pageSize: number; receipts: DeskReceipt[] };
    }>(`/api/desk/receipts${qs({ page, pageSize, q })}`);
  },
  releasePayout(accountId: string, amount: number, note?: string) {
    return request<{
      success: boolean;
      message?: string;
      data: { line: DeskLedgerLine; availableAfter: number };
    }>("/api/desk/payouts/release", {
      method: "POST",
      body: JSON.stringify({ accountId, amount, note }),
    });
  },
  holdShop(id: string) {
    return request<{ success: boolean; message?: string }>(`/api/desk/shops/${id}/hold`, {
      method: "POST",
    });
  },
  releaseShop(id: string) {
    return request<{ success: boolean; message?: string }>(`/api/desk/shops/${id}/release`, {
      method: "POST",
    });
  },
};
