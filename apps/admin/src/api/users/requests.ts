import {
  LocalUserPayload,
  Role,
  User,
  UserRolesApiResponse,
  UsersApiResponse,
} from "./types";
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

export const getUserById = async (id: string): Promise<User> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<User>(`/users/${id}`);

    if (!response.data) {
      throw new Error("No users data found");
    }

    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch user. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch user`);
    }
  }
};

export const getRoles = async (): Promise<Role[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<UserRolesApiResponse>(
      `/users/roles`
    );

    if (!response.data) {
      throw new Error("No roles data found");
    }

    return response.data.roles;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch roles. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch roles`);
    }
  }
};

export const getRolesByUserId = async (id: string): Promise<Role[]> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.get<UserRolesApiResponse>(
      `/users/${id}`
    );

    if (!response.data) {
      throw new Error("No roles data found");
    }

    return response.data.roles;
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to fetch roles by user id. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to fetch roles by user id`);
    }
  }
};

export const createLocalUser = async (
  localUser: LocalUserPayload
): Promise<User> => {
  const internalApiClient = getApiClient();
  try {
    const response = await internalApiClient.post<User>("/users", localUser);
    if (!response.data) {
      throw new Error("Could not create new user.");
    }
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    if (axiosError.response) {
      throw new Error(
        `Failed to create user. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error("Failed to create user");
    }
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  const internalApiClient = getApiClient();
  try {
    await internalApiClient.delete(`/users/${id}`);
  } catch (error) {
    const axiosError = error as InternalApiError;

    if (axiosError.response) {
      throw new Error(
        `Failed to delete user. ErrorId: ${axiosError.response.data.errorId}.`
      );
    } else {
      throw new Error(`Failed to delete user.`);
    }
  }
};
