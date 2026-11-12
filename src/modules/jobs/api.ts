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

export type JobRow = {
  id: string;
  askerId: string;
  workerId: string;
  quotation: number;
  visitFee: number;
  currency: string;
  packageRate: number;
  commission: number;
  netToWorker: number;
  status: "OPEN" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
  rail: string | null;
  completedAt: string | null;
  createdAt: string;
  asker: { id: string; name: string; photoUrl: string | null };
  worker: { id: string; name: string; photoUrl: string | null; package: string };
  receipt?: {
    id: string;
    receiptNo: string;
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
    jobId: string;
    askerId: string;
    workerId: string;
  } | null;
};

export const jobsApi = {
  list(page = 1, pageSize = 10) {
    return request<{
      success: boolean;
      data: { total: number; page: number; pageSize: number; jobs: JobRow[] };
    }>(`/api/jobs?page=${page}&pageSize=${pageSize}`);
  },
  create(body: {
    workerId: string;
    quotation: number;
    visitFee: number;
    rail: string;
  }) {
    return request<{ success: boolean; message?: string; data: { job: JobRow } }>(
      "/api/jobs",
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  accept(id: string) {
    return request<{ success: boolean; data: { job: JobRow } }>(`/api/jobs/${id}/accept`, {
      method: "POST",
    });
  },
  complete(
    id: string,
    body: {
      rail: string;
      walletPhone?: string;
      accountEmail?: string;
      cardNumber?: string;
      cardName?: string;
      cardExpiry?: string;
      cardCvc?: string;
      cashConfirmed?: boolean;
      returnUrl?: string;
      cancelUrl?: string;
    },
  ) {
    return request<{
      success: boolean;
      data:
        | {
            pending: true;
            mode?: string;
            status?: string;
            transactionId?: string;
            checkoutUrl?: string;
            clientSecret?: string;
            provider?: string;
            rail?: string;
            message?: string;
          }
        | {
            job: JobRow;
            receipt: {
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
          };
    }>(`/api/jobs/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  cancel(id: string) {
    return request<{ success: boolean; data: { job: JobRow } }>(`/api/jobs/${id}/cancel`, {
      method: "POST",
    });
  },
  listReceipts(page = 1, pageSize = 10) {
    return request<{
      success: boolean;
      data: {
        total: number;
        receipts: Array<{
          id: string;
          receiptNo: string;
          jobId: string;
          askerName: string;
          workerName: string;
          total: number;
          netToWorker: number;
          commission: number;
          currency: string;
          rail: string;
          createdAt: string;
        }>;
      };
    }>(`/api/jobs/receipts?page=${page}&pageSize=${pageSize}`);
  },
  getReceipt(id: string) {
    return request<{
      success: boolean;
      data: {
        receipt: {
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
      };
    }>(`/api/jobs/receipts/${id}`);
  },
};
