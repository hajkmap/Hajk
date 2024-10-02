export interface Group {
  id: string;
  locked: boolean;
  name: string;
}

export interface GroupsApiResponse {
  groups: Group[];
  count?: number;
  error: string;
  errorId: string;
}
