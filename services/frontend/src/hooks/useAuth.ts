import { useEffect } from "./useEffect";
import { useState } from "./useState";

export interface User {
  id: number;
  username: string;
}

export const useAuth = (): [boolean, boolean, User | null] => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_USER_SERVICE_HOST}/api/users/get/me`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          window.history.pushState({}, "", `/login`);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
        const data = await response.json();
        setUser({ ...data });
      } catch (err) {
        //console.log(err);
        window.history.pushState({}, "", `/login`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);
  return [loading, isAuthenticated, user];
};
