declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_modal' | '_top';
    returnUrl?: string;
  }

  interface CashfreeCheckoutResult {
    error?: {
      message?: string;
      code?: string;
      type?: string;
    };
    paymentDetails?: {
      paymentMessage?: string;
      [key: string]: any;
    };
    redirect?: boolean;
  }

  interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }

  interface LoadOptions {
    mode: 'sandbox' | 'production';
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance>;
}
