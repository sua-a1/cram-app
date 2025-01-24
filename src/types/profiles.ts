export type Profile = {
  user_id: string;
  display_name: string;
  role: 'customer' | 'employee' | 'admin';
  org_id?: string;
  department?: string;
  position?: string;
  created_at: string;
  updated_at: string;
}; 