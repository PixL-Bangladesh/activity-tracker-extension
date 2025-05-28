import axios from "axios";
import { config } from "~/config";

export const AXIOS = axios.create({
  baseURL: config.SERVER_URL,
});
