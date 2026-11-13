// Browser fixture only: production components and styles, no network or customer data.
export function useTenantCurrency() {
  return "USD";
}
export function useCurrentWorkspace() {
  return { active: { id: "fixture" } };
}
export function useWorkspaceMembers() {
  return { data: [{ user_id: "member", display_name: "Fixture owner" }] };
}
const mutation = {
  isPending: false,
  mutateAsync: async (value: unknown) => {
    (window as Window & { companySubmission?: unknown }).companySubmission = value;
  },
};
export function useCreateCompany() {
  return mutation;
}
export function useUpdateCompany() {
  return mutation;
}
export function useCustomFields() {
  return {
    data: [
      {
        id: "reference",
        key: "reference",
        label: "Reference",
        field_type: "text",
        is_visible: true,
        placeholder: "Company reference",
      },
    ],
    isLoading: false,
  };
}
export async function uploadCustomFieldFile() {
  return "fixture-file";
}
export const supabase = {};
