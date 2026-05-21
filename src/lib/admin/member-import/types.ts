export interface CsvValidationError {
  row: number;
  column: string;
  message: string;
}

export interface MemberImportRowResult {
  rowNumber: number;
  email: string;
  firstName: string;
  lastName: string;
  status: "created" | "updated" | "skipped" | "failed";
  errors: string[];
  warnings: string[];
  firebaseUid?: string;
  memberProfileId?: string;
  membershipRequestId?: string;
  rawRow: Record<string, string>;
}

export interface MemberImportBatchResult {
  id?: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt?: string;
  createdByEmail?: string;
  rows?: MemberImportRowResult[];
}
