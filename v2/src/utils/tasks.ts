import { AXIOS } from "~/lib/axios";

export const getInProgressTaskId = async (): Promise<string> => {
  try {
    const response1 = await AXIOS.get("/auth");
    const userId = response1.data.userId;
    const response2 = await AXIOS.get(`/tasks/in-progress/${userId}`);

    if (response2.status === 200) {
      console.log(response2.data);
      return response2.data.inProgressTasksId[0];
    }

    return "";
  } catch (error) {
    throw {
      message: "Error fetching tasks status",
      status: false,
      error,
    };
  }
};
