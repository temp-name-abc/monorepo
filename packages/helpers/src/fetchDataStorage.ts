import axios from "axios";

import { API_BASE_URL } from "utils";

const instance = axios.create({
    baseURL: API_BASE_URL,
});
