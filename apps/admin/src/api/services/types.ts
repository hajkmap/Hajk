export interface Service {
  id: string;
  locked: boolean;
  url: string;
  type: string;
  serverType: string;
  comment: string;
}

export interface ServicesApiResponse {
  services: Service[];
  count: number;
  error: string;
  errorId: string;
}

export interface ServiceFormData {
  url: string;
  locked: boolean;
  type: string;
  serverType: string;
  comment?: string;
}
