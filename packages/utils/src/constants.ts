import { envVariable } from "types";

export const API_BASE_URL = envVariable.parse(process.env.API_BASE_URL);
