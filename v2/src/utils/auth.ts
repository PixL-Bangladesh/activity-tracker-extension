import { AXIOS } from "~/lib/axios";

export const getAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await AXIOS.get("/auth");

    if (response.status === 200) {
      console.log(response.data);
      return true;
    }

    return false;
  } catch (error) {
    throw {
      message: "Error fetching authentication status",
      status: false,
      error,
    };
  }
};

export const getAuthInfo = async (): Promise<{
  authenticated: boolean;
  userId: string;
  email: string;
}> => {
  try {
    const response = await AXIOS.get("/auth");

    if (response.status === 200) {
      return response.data;
    }

    throw new Error("Failed to fetch authentication info");
  } catch (error) {
    throw {
      message: "Error fetching authentication info",
      status: false,
      error,
    };
  }
};
