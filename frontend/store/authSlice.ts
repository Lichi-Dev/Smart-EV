import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BOB_API = process.env.NEXT_PUBLIC_BOB_API_URL;

interface AuthState {
  token: string | null;
  role: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  role: null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    payload: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const resp = await axios.post(`${BOB_API}/api/v2/login`, {
        type: "password",
        email: payload.email,
        password: payload.password,
      });
      return resp.data as { token: string; role: string };
    } catch (err: any) {
      if (err.response?.status === 401) {
        return rejectWithValue("Invalid credentials");
      }
      return rejectWithValue(
        err.response?.data?.message || "Login failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.role = null;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    },
    hydrateAuth(state) {
      if (typeof window !== "undefined") {
        state.token = localStorage.getItem("token");
        state.role = localStorage.getItem("role");
      }
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("role", action.payload.role);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      });
  },
});

export const { logout, hydrateAuth, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
