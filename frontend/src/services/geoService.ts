import { api } from './api'
import type { GeoJSONFeatureCollection, NearbyTaskResult } from '../types'

export interface GeoTaskFilters {
  project?: number
  status?: string
  priority?: string
  assignee?: number
  bbox?: string
}

export const geoService = {
  async projects(bbox?: string) {
    const { data } = await api.get<GeoJSONFeatureCollection>('/geo/projects/', { params: { bbox } })
    return data
  },

  async tasks(filters: GeoTaskFilters = {}) {
    const { data } = await api.get<GeoJSONFeatureCollection>('/geo/tasks/', { params: filters })
    return data
  },

  async nearbyTasks(lat: number, lon: number, radiusKm = 5) {
    const { data } = await api.get<{ radius_km: number; count: number; results: NearbyTaskResult[] }>(
      '/geo/tasks/nearby/',
      { params: { lat, lon, radius_km: radiusKm } }
    )
    return data
  },
}
