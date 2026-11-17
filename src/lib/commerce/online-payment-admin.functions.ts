import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const orderInput = z.object({ orderId: z.string().uuid(), workspaceId: z.string().uuid() });

export const getStaffOnlinePayment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(orderInput)
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("commerce_orders")
      .select("id")
      .eq("id", data.orderId)
      .eq("workspace_id", data.workspaceId)
      .maybeSingle();
    if (error || !order) throw new Error("Order not found.");
    const { data: member } = await context.supabase
      .from("workspace_members")
      .select("role,status")
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", context.userId)
      .maybeSingle();
    const { staffOnlinePayment } = await import("./online-payments.server");
    const result = await staffOnlinePayment(data.orderId, data.workspaceId);
    const canManage =
      member?.status === "active" && (member.role === "owner" || member.role === "admin");
    return result && { ...result, canRefund: result.canRefund && canManage };
  });

export const refundStaffOnlinePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(orderInput)
  .handler(async ({ data, context }) => {
    const { data: member, error } = await context.supabase
      .from("workspace_members")
      .select("role,status")
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (
      error ||
      member?.status !== "active" ||
      (member.role !== "owner" && member.role !== "admin")
    ) {
      throw new Error("Only workspace owners and admins can request refunds.");
    }
    const { refundOnlinePayment } = await import("./online-payments.server");
    return refundOnlinePayment(data.orderId, data.workspaceId);
  });
