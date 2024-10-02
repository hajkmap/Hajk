export interface Service {
  id: string;
  url: string;
  type: string;
  serverType: string;
}

export interface ServicesApiResponse {
  services: Service[];
  count?: number;
  error: string;
  errorId: string;
}
