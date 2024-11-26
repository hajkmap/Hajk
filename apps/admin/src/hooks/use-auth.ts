import { useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import useUserStore, { User } from "../store/use-user-store";
import useAppStateStore from "../store/use-app-state-store";

const useAuth = () => {
  const { apiBaseUrl } = useAppStateStore.getState();
  const userStore = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (userStore.userLoading) {
      return;
    }

    const fetchUser = async () => {
      userStore.setUserLoading(true);
      try {
        const response = await axios.get(`${apiBaseUrl}/auth/user`, {
          withCredentials: true,
        });

        const data = response.data as {
          user: User;
        };

        if (response.status === 200) {
          userStore.setUser(data.user);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        void navigate("/login");
      } finally {
        userStore.setUserLoading(false);
      }
    };

    if (!userStore.user) {
      void fetchUser();
    }
  }, [apiBaseUrl, userStore, navigate]);

  const logout = async () => {
    try {
      await axios.post(
        `${apiBaseUrl}/auth/logout`,
        {},
        { withCredentials: true }
      );
      userStore.clearUser();
    } catch (error) {
      console.error("Failed to log out. Error: ", error);
    }
  };

  return { logout };
};

export default useAuth;
