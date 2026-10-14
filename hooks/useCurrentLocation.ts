"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getLocationServerSnapshot,
  getLocationSnapshot,
  locateCurrentPosition,
  LocationState,
  subscribeLocation,
} from "@/lib/locationStore";

// 저장된 위치가 없으면 처음 한 번 브라우저 위치를 요청한다
export function useCurrentLocation(): LocationState {
  const state = useSyncExternalStore(subscribeLocation, getLocationSnapshot, getLocationServerSnapshot);

  useEffect(() => {
    if (getLocationSnapshot().status === "idle") locateCurrentPosition();
  }, []);

  return state;
}
