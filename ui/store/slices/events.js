import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import { SEVERITY, STATUS } from '../../components/NotificationCenter/constants'

const initialState = {
  current_view: {
    page: 1,
    page_size: 10,
    filters: {
      initial: true,
    },
    has_more: true,
  }
}

const defaultEventProperties = {
  severity: SEVERITY.INFO,
  status: STATUS.UNREAD,
}

const eventsEntityAdapter = createEntityAdapter({
  selectId: (event) => event.id,
  //sort based on update_at timestamp(utc)
  sortComparer: (a, b) => {
    if (b?.updated_at?.localeCompare && a?.updated_at?.localeCompare) {
      return b.updated_at?.localeCompare(a.updated_at)
    }
    return 0
  }
})

export const eventsSlice = createSlice({
  name: 'events',
  initialState: eventsEntityAdapter.getInitialState(initialState),
  reducers: {

    clearEvents: (state) => {
      state.events = []
    },

    setEvents: (state, action) => {
      // state.events = action.payload || []
      eventsEntityAdapter.removeAll(state)
      eventsEntityAdapter.addMany(state, action.payload)
      if (action.payload.length == 0) {
        state.current_view.has_more = false
      }
    },


    pushEvents: (state, action) => {
      // state.events = [...state.events, ...action.payload]
      eventsEntityAdapter.addMany(state, action.payload)
      if (action.payload.length == 0) {
        state.current_view.has_more = false
      }
    },

    pushEvent: (state, action) => {
      const event = {
        ...action.payload,
        severity: action.payload?.severity?.trim() || defaultEventProperties.severity,
        status: action.payload?.status?.trim() || defaultEventProperties.status,
      }
      eventsEntityAdapter.addOne(state, event)
      // state.events = [event, ...state.events]
    },

    updateEvent: eventsEntityAdapter.updateOne,
    deleteEvent: eventsEntityAdapter.removeOne,

    clearCurrentView: (state) => {
      state.current_view = initialState.current_view
      state.events = []
    },

    setCurrentView: (state, action) => {
      state.current_view = action.payload
    }

  },
})

// Action creators are generated for each case reducer function
export const { pushEvent, clearEvents, setEvents,
  clearCurrentView,
  pushEvents, setCurrentView, updateEvent, deleteEvent: removeEvent
} = eventsSlice.actions

export default eventsSlice.reducer


export const loadEvents = (fetch, page, filters) => async (dispatch, getState) => {
  const currentView = getState().events.current_view

  try {
    const { data } = await fetch({ page, filters })
    dispatch(setCurrentView({
      ...currentView,
      page,
      filters
    }))
    if (page <= 1) {
      dispatch(setEvents(data?.events))
      return
    }
    dispatch(pushEvents(data?.events || []))
  } catch (e) {
    console.error("Error while setting events in store --loadEvents", e)
    return
  }
}

export const loadNextPage = (fetch) => async (dispatch, getState) => {
  const currentView = getState().events.current_view
  dispatch(loadEvents(fetch, currentView.page + 1, currentView.filters))
}

export const changeEventStatus = (mutator, id, status) => async (dispatch) => {
  dispatch(updateEvent({ id, changes: { status } }))
  mutator({ id, status })
}

export const deleteEvent = (mutator, id) => async (dispatch) => {
  dispatch(removeEvent(id))
  mutator({ id })
}


//selectors

//select all events
export const selectEvents = (state) => {
  return eventsEntityAdapter.getSelectors().selectAll(state.events)
}

export const selectEventById = (state, id) => {
  return eventsEntityAdapter.getSelectors().selectById(state.events, id)
}