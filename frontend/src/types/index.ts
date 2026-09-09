export type UserRole = "CITIZEN" | "OFFICER" | "DEPARTMENT_ADMIN" | "SUPER_ADMIN";

export interface User {
  id: number;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  department_id?: number | null;
  is_active: boolean;
}

export interface Department {
  id: number;
  code: string;
  state_code?: string;
  name: string;
  name_mr?: string;
  name_hi?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
}

export interface ServiceCategory {
  id: number;
  code: string;
  name: string;
  name_mr?: string;
  name_hi?: string;
  description?: string;
  icon?: string;
}

export interface DocumentRequirement {
  type: string;
  name: string;
  mandatory: boolean;
}

export interface FormField {
  key: string;
  label: string;
  label_mr?: string;
  label_hi?: string;
  type: "TEXT" | "NUMBER" | "DATE" | "DROPDOWN" | "RADIO" | "CHECKBOX" | "ADDRESS" | "PHONE" | "EMAIL" | "TEXTAREA";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ServiceItem {
  id: number;
  code: string;
  state_code?: string;
  name: string;
  name_mr?: string;
  name_hi?: string;
  department_id: number;
  department_name?: string;
  category_id: number;
  category_name?: string;
  description?: string;
  description_hi?: string;
  eligibility?: string;
  documents_required?: DocumentRequirement[];
  fee: number;
  processing_days: number;
  workflow_id?: string;
  integration_type: string;
  is_active: boolean;
  form_schema?: FormField[];
}

export interface TimelineEvent {
  id: number;
  old_status?: string | null;
  new_status: string;
  actor_name?: string;
  actor_role?: string;
  remarks?: string;
  created_at: string;
}

export interface AttachedDocument {
  id: number;
  document_type: string;
  file_name: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  verification_status: string;
  rejection_reason?: string;
  uploaded_at: string;
}

export interface ApplicationDetail {
  id: number;
  application_number: string;
  service_id: number;
  service_name?: string;
  service_code?: string;
  department_id: number;
  department_name?: string;
  citizen_id: number;
  citizen_name?: string;
  citizen_email?: string;
  citizen_phone?: string;
  status: string;
  form_data?: Record<string, any>;
  tracking_data?: Record<string, any>;
  remarks?: string;
  submitted_at: string;
  updated_at?: string;
  timeline: TimelineEvent[];
  documents: AttachedDocument[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  application_id?: number | null;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface DepartmentWorkload {
  department_name: string;
  department_code: string;
  total_applications: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface AdminAnalytics {
  total_applications: number;
  pending_review: number;
  approved: number;
  rejected: number;
  total_services: number;
  total_departments: number;
  total_citizens: number;
  status_distribution: StatusDistribution[];
  department_workload: DepartmentWorkload[];
}

export interface AuditLogItem {
  id: number;
  actor_id?: number;
  actor_name?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SuggestedService {
  id: number;
  name: string;
  name_mr?: string;
  name_hi?: string;
  state_code?: string;
  department_name: string;
  description?: string;
  fee: number;
  processing_days: number;
}

export interface ApplicationListItem {
  id: number;
  application_number: string;
  service_id: number;
  service_name?: string;
  department_id: number;
  department_name?: string;
  citizen_id: number;
  citizen_name?: string;
  status: string;
  submitted_at: string;
  updated_at?: string;
}
