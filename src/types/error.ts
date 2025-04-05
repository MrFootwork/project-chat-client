export type ResponseError = {
  message: string;
  code?: string;
  details?: Record<string, any>;
};
