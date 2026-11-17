import type {
  CreateLinkInput,
  CreateLinkResult,
  PaymentLinkProvider,
  PaymentProviderId,
} from "./types";

/**
 * Stub provider used when a real API key isn't configured. It returns null for
 * `hostedUrl` so the caller falls back to the internal `/pay/$token` page,
 * which displays the link details. The stub does not initiate a transaction.
 */
export function makeStubProvider(config: {
  id: PaymentProviderId;
  displayName: string;
  currencies?: readonly string[];
  supportsPartial?: boolean;
  supportsRecurring?: boolean;
  supportsRefunds?: boolean;
}): PaymentLinkProvider {
  return {
    id: config.id,
    displayName: config.displayName,
    currencies: config.currencies ?? [],
    supportsPartial: config.supportsPartial ?? true,
    supportsRecurring: config.supportsRecurring ?? true,
    supportsRefunds: false,
    async createLink(_input: CreateLinkInput): Promise<CreateLinkResult> {
      return {
        providerReference: null,
        hostedUrl: null,
        metadata: { provider: config.id, mode: "stub" },
      };
    },
  };
}
