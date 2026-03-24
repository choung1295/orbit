'use client'

import { useState, useCallback } from 'react'
import { CctvItem, CityCctvItem } from '../cctv/cctvUtils'

// ── 타입 ──────────────────────────────────────────────────────────────────
export type MapBaseType = 'normal' | 'satellite'
export type LayerId = 'urban-cctv' | 'city-cctv' | 'cadastral'
export type MeasureMode = 'distance' | 'area' | 'radius' | null
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error'

export interface MapBounds {
  minX: number; minY: number; maxX: number; maxY: number
}

/** 도시교통 / 시내교통 CCTV 선택 상태를 단일 discriminated union으로 관리 */
export type SelectedCctv =
  | { type: 'urban'; item: CctvItem }
  | { type: 'city'; item: CityCctvItem }
  | null

// ── 상수 ──────────────────────────────────────────────────────────────────
export const DEFAULT_VIEW = { lat: 39.2, lng: 127.5, level: 13 }
export const MAP_VIEW_KEY = 'orbit_map_view'
export const MAP_MEMORY_KEY = 'orbit_map_memory'

// ── Hook ──────────────────────────────────────────────────────────────────
export function useMapStore() {
  // ── 지도 코어 ─────────────────────────────────────────────────────────
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapBaseType, setMapBaseType] = useState<MapBaseType>('satellite')
  const [locationMemory, setLocationMemory] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(MAP_MEMORY_KEY) !== 'false'
  })
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(new Set())
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_VIEW.level)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)

  // ── CCTV 선택 (통합) ──────────────────────────────────────────────────
  const [selectedCctv, setSelectedCctv] = useState<SelectedCctv>(null)
  const [reconnectKey, setReconnectKey] = useState(0)

  const selectUrbanCctv = useCallback((item: CctvItem) => {
    setSelectedCctv({ type: 'urban', item })
  }, [])

  const selectCityCctv = useCallback((item: CityCctvItem) => {
    setSelectedCctv({ type: 'city', item })
  }, [])

  /** 선택 해제 (reconnectKey도 리셋) */
  const clearSelection = useCallback(() => {
    setSelectedCctv(null)
    setReconnectKey(0)
  }, [])

  /** 도시교통 선택만 해제 (시내교통 선택 유지) */
  const clearUrbanSelection = useCallback(() => {
    setSelectedCctv(prev => (prev?.type === 'urban' ? null : prev))
  }, [])

  /** 시내교통 선택만 해제 (도시교통 선택 유지) */
  const clearCitySelection = useCallback(() => {
    setSelectedCctv(prev => (prev?.type === 'city' ? null : prev))
  }, [])

  // ── 도시교통 CCTV 데이터 ──────────────────────────────────────────────
  const [urbanCctvList, setUrbanCctvList] = useState<CctvItem[]>([])
  const [urbanCctvState, setUrbanCctvState] = useState<LoadingState>('idle')

  // ── 시내교통 CCTV 데이터 ──────────────────────────────────────────────
  const [cityCctvList, setCityCctvList] = useState<CityCctvItem[]>([])
  const [cityCctvState, setCityCctvState] = useState<LoadingState>('idle')

  // ── 내 위치 ───────────────────────────────────────────────────────────
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // ── UI 상태 ───────────────────────────────────────────────────────────
  const [showRoutePanel, setShowRoutePanel] = useState(false)
  const [measureMode, setMeasureMode] = useState<MeasureMode>(null)
  const [toolDrawerOpen, setToolDrawerOpen] = useState(false)
  const [showCctvDropdown, setShowCctvDropdown] = useState(false)

  // ── 위치기억 토글 ─────────────────────────────────────────────────────
  const toggleLocationMemory = useCallback(() => {
    setLocationMemory(prev => {
      const next = !prev
      localStorage.setItem(MAP_MEMORY_KEY, String(next))
      return next
    })
  }, [])

  return {
    // map core
    isMapReady, setIsMapReady,
    mapBaseType, setMapBaseType,
    locationMemory, toggleLocationMemory,
    activeLayers, setActiveLayers,
    zoomLevel, setZoomLevel,
    mapBounds, setMapBounds,

    // cctv selection (unified)
    selectedCctv, selectUrbanCctv, selectCityCctv,
    clearSelection, clearUrbanSelection, clearCitySelection,
    reconnectKey, setReconnectKey,

    // urban cctv data
    urbanCctvList, setUrbanCctvList,
    urbanCctvState, setUrbanCctvState,

    // city cctv data
    cityCctvList, setCityCctvList,
    cityCctvState, setCityCctvState,

    // my location
    myLocation, setMyLocation,
    locationLoading, setLocationLoading,

    // UI
    showRoutePanel, setShowRoutePanel,
    measureMode, setMeasureMode,
    toolDrawerOpen, setToolDrawerOpen,
    showCctvDropdown, setShowCctvDropdown,
  }
}
