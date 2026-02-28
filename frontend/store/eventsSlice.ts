import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BOB_API = process.env.NEXT_PUBLIC_BOB_API_URL;

export interface EventFilters {
  event_type: string;
  mode_of_event: string;
  city: string;
  state: string;
  registration_type: string;
  who_can_register: string;
  schedule: string;
  start_date: string;
  end_date: string;
  sort: string;
  q: string;
  page: number;
  per_page: number;
}

export const defaultFilters: EventFilters = {
  event_type: "",
  mode_of_event: "",
  city: "",
  state: "",
  registration_type: "",
  who_can_register: "public_users_bob_members",
  schedule: "",
  start_date: "",
  end_date: "",
  sort: "newest",
  q: "",
  page: 1,
  per_page: 12,
};

export interface BobEvent {
  id: number;
  title: string;
  description?: string;
  event_type?: string;
  mode_of_event?: string;
  registration_type?: string;
  city?: string;
  state?: string;
  start_date?: string;
  end_date?: string;
  banner_image?: string;
  venue?: string;
  who_can_register?: string;
  status?: string;
  [key: string]: any;
}

interface EventsState {
  items: BobEvent[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: EventFilters;
}

const initialState: EventsState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  filters: { ...defaultFilters },
};

export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (filters: EventFilters, { rejectWithValue }) => {
    try {
      const params: Record<string, string | number> = {
        page: filters.page,
        per_page: filters.per_page,
        sort: filters.sort,
      };
      if (filters.who_can_register) params.who_can_register = filters.who_can_register;
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.mode_of_event) params.mode_of_event = filters.mode_of_event;
      if (filters.city) params.city = filters.city;
      if (filters.state) params.state = filters.state;
      if (filters.registration_type) params.registration_type = filters.registration_type;
      if (filters.schedule) params.schedule = filters.schedule;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.q) params.q = filters.q;

      const resp = await axios.get(`${BOB_API}/api/public/v2/event/list`, {
        params,
      });

      return {
        items: resp.data?.data?.data ?? resp.data?.data ?? [],
        total: resp.data?.data?.total ?? resp.data?.total ?? 0,
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch events"
      );
    }
  }
);

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<EventFilters>>) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
    },
    resetFilters(state) {
      state.filters = { ...defaultFilters };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch events";
      });
  },
});

export const { setFilters, setPage, resetFilters } = eventsSlice.actions;
export default eventsSlice.reducer;
