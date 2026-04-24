import type { ValidateRuleItem } from "@/interfaces/validateRuleInterface.ts";
import axios from "@/api/axios";

export type FetchValidateRuleListParams = {
  page: number;
  pageSize: string;
  stdSeCd?: string;
  searchType?: string;
  searchKeyword?: string;
};

export type FetchValidateRuleListResponse = {
  list: ValidateRuleItem[];
  totalCount: number;
};

export const fetchValidateRuleList = (params: FetchValidateRuleListParams): Promise<FetchValidateRuleListResponse> => {
  return axios.get("/validate-rule/selectList", { params }).then((res) => ({
    list: res.data?.data || [],
    totalCount: res.data?.total || 0,
  }));
};

export const fetchValidateRuleDetail = (params: { vrfcSn: string }): Promise<ValidateRuleItem> => {
  return axios.get("/validate-rule/selectDetail", { params }).then((res) => res.data?.data);
};

export const insertValidateRule = (data: Partial<ValidateRuleItem>): Promise<any> => {
  return axios.post("/validate-rule/insertValidateRule", data).then((res) => res.data?.data);
};

export const updateValidateRule = (data: Partial<ValidateRuleItem> & { vrfcSn: string }): Promise<any> => {
  return axios.put("/validate-rule/updateValidateRule", data).then((res) => res.data?.data);
};

export const deleteValidateRule = (data: { vrfcSn: string }): Promise<any> => {
  return axios.delete("/validate-rule/deleteValidateRule", { data }).then((res) => res.data?.data);
};
