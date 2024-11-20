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
