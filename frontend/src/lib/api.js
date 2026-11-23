import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000", // API 고정
  withCredentials: true,            // 매 요청 코드
});