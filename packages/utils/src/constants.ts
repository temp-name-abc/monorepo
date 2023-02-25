import { envVariable } from "types";

export const API_BASE_URL = envVariable.parse(process.env.NEXT_PUBLIC_API_BASE_URL);
