import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useUserStore, { User } from "../store/use-user-store";
import useAppStateStore from "../store/use-app-state-store";

const useAuth = () => {
  const user = useUserStore((state) => state.user);
  const { apiBaseUrl } = useAppStateStore.getState();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/auth/user`, {
          withCredentials: true,
        });

        const data = response.data as {
          user: User;
        };

        if (response.status === 200) {
          setUser(data.user);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        navigate("/login");
      }
    };

    if (!user) {
      void fetchUser();
    }
  }, [user, setUser, navigate, apiBaseUrl]);

  const logout = async () => {
    try {
      await axios.post(
        `${apiBaseUrl}/auth/logout`,
        {},
        { withCredentials: true }
      );
      clearUser();
    } catch (error) {
      console.error("Failed to log out. Error: ", error);
    }
  };

  return { logout };
};

export default useAuth;
