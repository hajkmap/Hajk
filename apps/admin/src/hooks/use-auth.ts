import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useUserStore, { User } from "../store/use-user-store";
import useAppStateStore from "../store/use-app-state-store";

const useAuth = () => {
  const user = useUserStore((state) => state.user);
  const { apiBaseUrl } = useAppStateStore.getState();
  const setUser = useUserStore((state) => state.setUser);
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
};

export default useAuth;
