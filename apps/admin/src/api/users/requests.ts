import { User, UsersApiResponse } from "./types";
import { getApiClient, InternalApiError } from "../../lib/internal-api-client";

/**
 * This module provides API request functions to interact with the backend
 * services for fetching data related to users.
 *
 * - The `getUsers` function retrieves a list of all users.
 *
 * These functions utilize a custom Axios instance and throw appropriate error messages for failures.
 *
 * All functions return a Promise with the expected data format or throw an error in case of failure.
 */

// Fetch layers
export const getUsers = async (): Promise<User[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<UsersApiResponse>("/users");

    if (!response.data) {
      throw new Error("No users data found");
    }

    return response.data.users;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch users. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch users`);
    }
  }
};
