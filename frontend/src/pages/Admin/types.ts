export type AccessRequestStatus = "pending" | "approved" | "rejected";

export interface AccessRequest {
  _id: string;
  fullName: string;
  email: string;
  useCase: string;
  status: AccessRequestStatus;
  createdAt: string;
  approvedAt: string | null;
}

export interface AccessRequestsResponse {
  requests: AccessRequest[];
}
