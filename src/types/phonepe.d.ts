declare module 'pg-sdk-node' {
  export enum Env {
    SANDBOX = 'SANDBOX',
    PRODUCTION = 'PRODUCTION'
  }

  export class StandardCheckoutClient {
    static getInstance(
      clientId: string,
      clientSecret: string,
      clientVersion: string,
      env: Env
    ): StandardCheckoutClient;

    pay(request: StandardCheckoutPayRequest): Promise<StandardCheckoutPayResponse>;
    getOrderStatus(merchantOrderId: string): Promise<OrderStatusResponse>;
    validateCallback(
      username: string,
      password: string,
      authorization: string,
      responseBody: string
    ): CallbackResponse;
  }

  export class StandardCheckoutPayRequest {
    static builder(): StandardCheckoutPayRequestBuilder;
  }

  export class StandardCheckoutPayRequestBuilder {
    merchantOrderId(orderId: string): StandardCheckoutPayRequestBuilder;
    amount(amount: number): StandardCheckoutPayRequestBuilder;
    redirectUrl(url: string): StandardCheckoutPayRequestBuilder;
    metaInfo(metaInfo: MetaInfo): StandardCheckoutPayRequestBuilder;
    build(): StandardCheckoutPayRequest;
  }

  export class MetaInfo {
    static builder(): MetaInfoBuilder;
  }

  export class MetaInfoBuilder {
    udf1(value: string): MetaInfoBuilder;
    udf2(value: string): MetaInfoBuilder;
    udf3(value: string): MetaInfoBuilder;
    udf4(value: string): MetaInfoBuilder;
    udf5(value: string): MetaInfoBuilder;
    build(): MetaInfo;
  }

  export interface StandardCheckoutPayResponse {
    state: string;
    redirectUrl: string;
    orderId: string;
    expireAt: string;
  }

  export interface OrderStatusResponse {
    order_id: string;
    state: string;
    amount: number;
    expire_at: number;
    metaInfo: MetaInfo;
    payment_details: PaymentDetail[];
  }

  export interface PaymentDetail {
    transactionId: string;
    paymentMode: string;
    timestamp: number;
    amount: number;
    state: string;
    errorCode?: string;
    detailedErrorCode?: string;
  }

  export interface CallbackResponse {
    type: string;
    payload: CallbackData;
  }

  export interface CallbackData {
    merchantId: string;
    orderId?: string;
    originalMerchantOrderId?: string;
    refundId?: string;
    merchantRefundId?: string;
    state: string;
    amount: number;
    expireAt: number;
    errorCode?: string;
    detailedErrorCode?: string;
    metaInfo?: MetaInfo;
    paymentDetails?: PaymentDetail[];
  }

  export class CreateSdkOrderRequest {
    static StandardCheckoutBuilder(): CreateSdkOrderRequestBuilder;
  }

  export class CreateSdkOrderRequestBuilder {
    merchantOrderId(orderId: string): CreateSdkOrderRequestBuilder;
    amount(amount: number): CreateSdkOrderRequestBuilder;
    redirectUrl(url: string): CreateSdkOrderRequestBuilder;
    build(): CreateSdkOrderRequest;
  }

  export class PhonePeException extends Error {
    code: string;
    httpStatusCode: number;
    data: any;
  }
}
