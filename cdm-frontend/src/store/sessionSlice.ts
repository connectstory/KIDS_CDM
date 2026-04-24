// store/sessionSlice.ts
import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AuthrtType } from "@/constants/types";
import type { SessionData } from "@/interfaces/commonInterface.ts";
import { parseMenuAuthList, parseMenuAuthMap } from "@/interfaces/menuAuthInterface";
import axios from "@/api/axios";

export const SESSION_PP_AUTH_KEY = "auth";
export const SESSION_CM_AUTH_KEY = "cmAuth";
export const SESSION_TOKEN_KEY = "accessToken";
export const SESSION_UPDTOKEN = "updtTokenCn";
export const SESSION_PERSIST = "persist:root";

// ── sessionStorage 저장/복원 ───────────────────────────────────────────────────
function getStoredSession(): Partial<SessionData> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CM_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      userType: parsed.userType as string | undefined,
      userNo: parsed.userNo as string | undefined,
      userName: parsed.userName as string | undefined,
      loginTime: typeof parsed.loginTime === "number" ? parsed.loginTime : undefined,
      mbrNo: parsed.mbrNo as string | undefined,
      mbrId: parsed.mbrId as string | undefined,
      mbrTypeCd: parsed.mbrTypeCd as string | undefined,
      instId: parsed.instId as string | undefined,
      instNm: parsed.instNm as string | undefined,
      pblntSn: typeof parsed.pblntSn === "number" ? parsed.pblntSn : undefined,
      authrtTypeCd: parsed.authrtTypeCd as AuthrtType | undefined,
      authorities: Array.isArray(parsed.authorities) ? (parsed.authorities as string[]) : [],
      empNo: parsed.empNo as string | undefined,
      empNm: parsed.empNm as string | undefined,
      deptNo: parsed.deptNo as string | undefined,
      menuAuthList: parseMenuAuthList(parsed.menuAuthList),
      menuAuthMap: parseMenuAuthMap(parsed.menuAuthMap),
    };
  } catch {
    return null;
  }
}

function saveSessionToStorage(data: SessionData) {
  try {
    const toStore = {
      userType: data.userType,
      userNo: data.userNo,
      userName: data.userName,
      loginTime: data.loginTime,
      mbrNo: data.mbrNo,
      mbrId: data.mbrId,
      mbrTypeCd: data.mbrTypeCd,
      instId: data.instId,
      instNm: data.instNm,
      pblntSn: data.pblntSn,
      authrtTypeCd: data.authrtTypeCd,
      authorities: data.authorities,
      empNo: data.empNo,
      empNm: data.empNm,
      deptNo: data.deptNo,
      menuAuthList: data.menuAuthList,
      menuAuthMap: data.menuAuthMap,
    };
    sessionStorage.setItem(SESSION_CM_AUTH_KEY, JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

export function clearSessionStorage() {
  sessionStorage.removeItem(SESSION_CM_AUTH_KEY);
  sessionStorage.removeItem(SESSION_PP_AUTH_KEY);
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_UPDTOKEN);
  sessionStorage.removeItem(SESSION_PERSIST);
  localStorage.removeItem(SESSION_CM_AUTH_KEY);
  localStorage.removeItem(SESSION_PP_AUTH_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_UPDTOKEN);
  localStorage.removeItem(SESSION_PERSIST);
}

// ── /me API 응답 타입 정의 ────────────────────────────────────────────────────

interface AdminMeApiResponse {
  userNo?: string;
  userName?: string;
  empNo?: string;
  empNm?: string;
  deptNo?: string;
  instId?: string;
  instNm?: string;
  loginTime?: number;
  userType?: string;
  menuAuthList?: unknown;
  menuAuthMap?: unknown;
}

interface PartnerMeApiResponse {
  userNo?: string;
  userName?: string;
  mbrNo?: string;
  mbrId?: string;
  instId?: string;
  instNm?: string;
  loginTime?: number;
  userType?: string;
  menuAuthList?: unknown;
}

const stored = getStoredSession();
const initialState: SessionData = {
  userType: stored?.userType ?? undefined,
  userNo: stored?.userNo ?? undefined,
  userName: stored?.userName ?? undefined,
  loginTime: stored?.loginTime ?? undefined,
  mbrNo: stored?.mbrNo ?? undefined,
  mbrId: stored?.mbrId ?? undefined,
  mbrTypeCd: stored?.mbrTypeCd ?? undefined,
  instId: stored?.instId ?? undefined,
  instNm: stored?.instNm ?? undefined,
  pblntSn: stored?.pblntSn ?? undefined,
  authrtTypeCd: stored?.authrtTypeCd ?? undefined,
  authorities: stored?.authorities ?? [],
  isLoading: false,
  empNo: stored?.empNo ?? undefined,
  empNm: stored?.empNm ?? undefined,
  deptNo: stored?.deptNo ?? undefined,
  menuAuthList: stored?.menuAuthList ?? [],
  menuAuthMap: stored?.menuAuthMap ?? {},
};

// ── Async Thunk: /me API 호출 ────────────────────────────────────────────────
export const fetchAdminMe = createAsyncThunk<AdminMeApiResponse, void>("session/fetchAdminMe", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axios.get("/auth/me/admin");
    return data.data;
  } catch {
    return rejectWithValue(null);
  }
});

export const fetchPartnerMe = createAsyncThunk<PartnerMeApiResponse, void>(
  "session/fetchPartnerMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get("/auth/me/partner");
      return data.data;
    } catch {
      return rejectWithValue(null);
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────
const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    loadSession: (state, action: PayloadAction<Partial<SessionData> | undefined>) => {
      if (action.payload) {
        state.userType = action.payload.userType ?? undefined;
        state.userNo = action.payload.userNo ?? undefined;
        state.mbrNo = action.payload.mbrNo ?? undefined;
        state.mbrId = action.payload.mbrId ?? undefined;
        state.userName = action.payload.userName ?? undefined;
        state.mbrTypeCd = action.payload.mbrTypeCd ?? undefined;
        state.instId = action.payload.instId ?? undefined;
        state.instNm = action.payload.instNm ?? undefined;
        state.pblntSn = action.payload.pblntSn ?? undefined;
        state.authrtTypeCd = action.payload.authrtTypeCd ?? undefined;
        state.empNo = action.payload.empNo ?? undefined;
        state.empNm = action.payload.empNm ?? undefined;
        state.deptNo = action.payload.deptNo ?? undefined;
        state.loginTime = action.payload.loginTime ?? state.loginTime ?? undefined;
        if (action.payload.authorities !== undefined) state.authorities = action.payload.authorities;
        if (action.payload.menuAuthList !== undefined) state.menuAuthList = action.payload.menuAuthList;
        if (action.payload.menuAuthMap !== undefined) state.menuAuthMap = action.payload.menuAuthMap;
        saveSessionToStorage(state);
      }
    },

    logout: (state) => {
      state.userType = undefined;
      state.userNo = undefined;
      state.mbrNo = undefined;
      state.mbrId = undefined;
      state.userName = undefined;
      state.mbrTypeCd = undefined;
      state.instId = undefined;
      state.instNm = undefined;
      state.pblntSn = undefined;
      state.authrtTypeCd = undefined;
      state.authorities = [];
      state.empNo = undefined;
      state.empNm = undefined;
      state.deptNo = undefined;
      state.loginTime = undefined;
      state.menuAuthList = [];
      state.menuAuthMap = {};
      clearSessionStorage();
    },

    setPblntSn: (state, action: PayloadAction<number | undefined>) => {
      state.pblntSn = action.payload;
      saveSessionToStorage(state);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminMe.fulfilled, (state, action) => {
        state.isLoading = false;
        const p = action.payload;
        const id = p.userNo ?? p.empNo;
        if (id) state.userNo = id;
        state.userName = p.userName ?? p.empNm ?? state.userName;
        state.empNo = p.empNo ?? p.userNo ?? state.empNo;
        state.empNm = p.empNm ?? p.userName ?? state.empNm;
        state.deptNo = p.deptNo ?? state.deptNo;
        state.instId = p.instId ?? state.instId;
        state.loginTime = p.loginTime ?? state.loginTime;
        state.userType = "A";
        const nextMenuList = parseMenuAuthList(p.menuAuthList);
        if (nextMenuList.length > 0) {
          state.menuAuthList = nextMenuList;
        }
        const nextMenuMap = parseMenuAuthMap(p.menuAuthMap);
        if (Object.keys(nextMenuMap).length > 0) {
          state.menuAuthMap = nextMenuMap;
        }
        saveSessionToStorage(state);
      })
      .addCase(fetchAdminMe.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchPartnerMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPartnerMe.fulfilled, (state, action) => {
        state.isLoading = false;
        const p = action.payload;
        state.userNo = p.userNo ?? undefined;
        state.mbrNo = p.mbrNo ?? undefined;
        state.mbrId = p.mbrId ?? undefined;
        state.userName = p.userName ?? state.userName;
        state.instId = p.instId ?? state.instId;
        state.instNm = p.instNm ?? state.instNm;
        state.loginTime = p.loginTime ?? state.loginTime;
        state.userType = "P";
        const nextMenuList = parseMenuAuthList(p.menuAuthList);
        if (nextMenuList.length > 0) {
          state.menuAuthList = nextMenuList;
        }
        saveSessionToStorage(state);
      })
      .addCase(fetchPartnerMe.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { logout, loadSession, setPblntSn } = sessionSlice.actions;

export default sessionSlice.reducer;
