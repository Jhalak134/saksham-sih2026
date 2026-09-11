// components/discover/IndiaMap.tsx
// 3-Level Interactive Map:
// Level 1: All India National Heatmap (State opportunities, click to inspect or enter UP)
// Level 2: Uttar Pradesh District Map (Highlighting Mathura as active pilot district)
// Level 3: Mathura District OpenStreetMap (MapLibre OSM GeoJSON tehsils & village clusters with search)

'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Map, { Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/cn';
import { INDIA_STATES, INDIA_VIEWBOX, type MapLocation } from '@/data/indiaMapData';
import { getStateDistricts, type DistrictLocation } from '@/data/stateDistrictsData';
import {
  getStateOpportunityProfile,
  getOpportunityLevelColor,
} from '@/data/stateOpportunitiesData';
import { Plus, Minus, X, ArrowLeft, MapPin, Search, RotateCcw, Lock, Sparkles, Layers } from 'lucide-react';

// Mathura District Geographic Bounds & Limits
const MATHURA_CENTER = {
  longitude: 77.6364,
  latitude: 27.6005,
};

const MATHURA_INITIAL_ZOOM = 9.8;
const MATHURA_MIN_ZOOM = 9.0;
const MATHURA_MAX_ZOOM = 18.0;

// Bounding box for Mathura District extent with breathing room: [minLng, minLat], [maxLng, maxLat]
const MATHURA_MAX_BOUNDS: [number, number, number, number] = [
  77.20, 27.15, // Southwest (lng, lat)
  78.08, 28.05, // Northeast (lng, lat)
];

// OpenStreetMap standard tile raster style
const OSM_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

interface VillageFeature {
  readonly id: string;
  readonly name: string;
  readonly place?: string;
  readonly postalCode?: string;
  readonly coordinates: [number, number];
}

interface IndiaMapProps {
  readonly selectedState: string | null;
  readonly onStateSelect: (state: string | null) => void;
  readonly selectedDistrict?: string | null;
  readonly onDistrictSelect?: (district: string | null) => void;
}

export function IndiaMap({
  selectedState,
  onStateSelect,
  selectedDistrict = null,
  onDistrictSelect,
}: IndiaMapProps): React.JSX.Element {
  const mapRef = useRef<MapRef | null>(null);

  // Hover states for Levels 1 & 2
  const [hoveredState, setHoveredState] = useState<MapLocation | null>(null);
  const [hoveredDistrictLocation, setHoveredDistrictLocation] = useState<DistrictLocation | null>(null);

  // Level 3 (MapLibre OSM) states
  const [hoveredVillage, setHoveredVillage] = useState<{
    readonly name: string;
    readonly place?: string;
    readonly postalCode?: string;
    readonly x: number;
    readonly y: number;
  } | null>(null);

  const [isLoadingLevel3, setIsLoadingLevel3] = useState<boolean>(true);
  const [villageSearchQuery, setVillageSearchQuery] = useState<string>('');
  const [villageFeatures, setVillageFeatures] = useState<readonly VillageFeature[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [cursorStyle, setCursorStyle] = useState<string>('grab');

  // Zoom for Level 1 & 2 SVG
  const [svgZoomLevel, setSvgZoomLevel] = useState<number>(1);

  // Active state district data from stateDistrictsData.ts
  const stateData = useMemo(() => {
    return selectedState ? getStateDistricts(selectedState) : null;
  }, [selectedState]);

  // Check if active view is Uttar Pradesh / Level 2 or Level 3
  const isUP = useMemo(() => {
    if (!selectedState) return false;
    const clean = selectedState.trim().toLowerCase();
    return clean.includes('uttar pradesh') || clean === 'up';
  }, [selectedState]);

  // Level 3: Mathura District selected within UP
  const isLevel3Mathura = useMemo(() => {
    if (!isUP) return false;
    return selectedDistrict !== null;
  }, [isUP, selectedDistrict]);

  // Level 2: UP selected but district is not yet selected
  const isLevel2UP = useMemo(() => {
    return isUP && !isLevel3Mathura;
  }, [isUP, isLevel3Mathura]);

  // Timeout fallback to ensure Level 3 loading shimmer never gets stuck
  useEffect(() => {
    if (isLevel3Mathura) {
      setIsLoadingLevel3(true);
      const timer = setTimeout(() => {
        setIsLoadingLevel3(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isLevel3Mathura]);

  // Load Village GeoJSON points for search autocomplete and lookup
  useEffect(() => {
    if (isLevel3Mathura && villageFeatures.length === 0) {
      fetch('/data/geo/mathura-villages.geojson')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.features)) {
            const list: VillageFeature[] = data.features
              .map((f: { id?: string; properties?: Record<string, string>; geometry?: { coordinates?: [number, number] } }) => {
                const name = f.properties?.name;
                const coords = f.geometry?.coordinates;
                if (!name || !coords) return null;
                return {
                  id: f.id || name,
                  name,
                  place: f.properties?.place,
                  postalCode: f.properties?.postal_code,
                  coordinates: coords,
                };
              })
              .filter((v: VillageFeature | null): v is VillageFeature => v !== null);

            list.sort((a, b) => a.name.localeCompare(b.name));
            setVillageFeatures(list);
          }
        })
        .catch(() => {
          // Fallback gracefully
        });
    }
  }, [isLevel3Mathura, villageFeatures.length]);

  // Filtered village search list
  const searchResults = useMemo(() => {
    if (!villageSearchQuery.trim()) return [];
    const q = villageSearchQuery.trim().toLowerCase();
    return villageFeatures.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 8);
  }, [villageFeatures, villageSearchQuery]);

  // LEVEL 1: Click handler for states on the national heatmap
  const handleStateClick = (state: MapLocation) => {
    const isStateUP = state.id === 'up' || state.name.toLowerCase().includes('uttar pradesh');
    if (isStateUP) {
      onStateSelect('Uttar Pradesh');
      if (onDistrictSelect) onDistrictSelect(null);
      setSvgZoomLevel(1);
    } else {
      // Non-UP state: select state to update info bar on the right
      onStateSelect(state.name);
      if (onDistrictSelect) onDistrictSelect(null);
    }
  };

  // LEVEL 2: UP District Click Handler
  const handleDistrictClick = (district: DistrictLocation) => {
    const isMathura = district.name.toLowerCase().includes('mathura') || district.id.toLowerCase().includes('mathura');
    if (isMathura && onDistrictSelect) {
      onDistrictSelect('Mathura');
    }
  };

  // LEVEL 3: MapLibre Map Interaction Handlers
  const handleMapClick = useCallback((event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
    const feature = event.features?.[0];
    if (!feature) return;

    if (feature.layer.id === 'clusters') {
      const clusterId = feature.properties?.cluster_id;
      const mapSource = mapRef.current?.getSource('mathura-villages-source') as maplibregl.GeoJSONSource;
      if (mapSource && clusterId !== undefined) {
        mapSource.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geom = feature.geometry as unknown as { coordinates: [number, number] };
          if (geom?.coordinates) {
            mapRef.current?.flyTo({
              center: geom.coordinates,
              zoom,
              speed: 1.2,
            });
          }
        });
      }
    } else if (feature.layer.id === 'unclustered-point' || feature.layer.id === 'unclustered-label') {
      const name = feature.properties?.name;
      if (name && onDistrictSelect) {
        onDistrictSelect(name);
      }
    }
  }, [onDistrictSelect]);

  const handleMouseEnterLayer = useCallback((event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
    setCursorStyle('pointer');
    const feature = event.features?.[0];
    if (feature && (feature.layer.id === 'unclustered-point' || feature.layer.id === 'unclustered-label')) {
      const name = feature.properties?.name;
      if (name) {
        setHoveredVillage({
          name,
          place: feature.properties?.place,
          postalCode: feature.properties?.postal_code,
          x: event.point.x,
          y: event.point.y,
        });
      }
    }
  }, []);

  const handleMouseLeaveLayer = useCallback(() => {
    setCursorStyle('grab');
    setHoveredVillage(null);
  }, []);

  const handleSelectVillageFromSearch = (village: VillageFeature) => {
    setVillageSearchQuery(village.name);
    setIsSearchOpen(false);
    if (onDistrictSelect) {
      onDistrictSelect(village.name);
    }
    mapRef.current?.flyTo({
      center: village.coordinates,
      zoom: 14.5,
      speed: 1.3,
      essential: true,
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (isLevel3Mathura) {
      mapRef.current?.zoomIn();
    } else {
      setSvgZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
    }
  };

  const handleZoomOut = () => {
    if (isLevel3Mathura) {
      mapRef.current?.zoomOut();
    } else {
      setSvgZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
    }
  };

  const handleResetZoom = () => {
    if (isLevel3Mathura) {
      mapRef.current?.flyTo({
        center: [MATHURA_CENTER.longitude, MATHURA_CENTER.latitude],
        zoom: MATHURA_INITIAL_ZOOM,
        essential: true,
      });
    } else {
      setSvgZoomLevel(1);
    }
  };

  return (
    <div className="relative flex h-full min-h-[460px] md:min-h-[520px] w-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 md:p-5 shadow-xs overflow-hidden">
      {/* ── TOP CONSOLIDATED HEADER & BREADCRUMB SURFACE ── */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/90 pb-3">
        {/* Navigation Breadcrumb Trail */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedState ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  onStateSelect(null);
                  if (onDistrictSelect) onDistrictSelect(null);
                  setSvgZoomLevel(1);
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-xs"
                aria-label="Back to India Map"
              >
                <ArrowLeft size={13} strokeWidth={2.5} />
                <span>All India</span>
              </button>

              <span className="text-slate-300">/</span>

              {isLevel3Mathura ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDistrictSelect) onDistrictSelect(null);
                      setSvgZoomLevel(1);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
                    aria-label="Back to Uttar Pradesh"
                  >
                    <ArrowLeft size={12} strokeWidth={2.5} />
                    <span>Uttar Pradesh</span>
                  </button>

                  <span className="text-slate-300">/</span>

                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Mathura District</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 shadow-xs">
                      <Sparkles size={10} className="text-amber-600" />
                      Pilot Active
                    </span>
                  </span>
                </>
              ) : isLevel2UP ? (
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Uttar Pradesh</span>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/80">
                    {stateData?.districtCount ?? 75} Districts
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-300">
                    <Sparkles size={10} className="text-emerald-700" />
                    Pilot Live
                  </span>
                </span>
              ) : (
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{selectedState}</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                    Selected State
                  </span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">National Opportunities Heatmap</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/80">
                <Sparkles size={10} className="text-emerald-600" />
                UP Pilot Live
              </span>
            </div>
          )}
        </div>

        {/* Selected State & District Chips */}
        <div className="flex items-center gap-1.5">
          {selectedState && (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs">
              <span>{selectedState}</span>
              <button
                type="button"
                onClick={() => {
                  onStateSelect(null);
                  if (onDistrictSelect) onDistrictSelect(null);
                }}
                aria-label={`Remove ${selectedState} filter`}
                className="flex h-3.5 w-3.5 items-center justify-center rounded text-emerald-600 hover:text-emerald-900 transition-colors"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {selectedDistrict && onDistrictSelect && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-50/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-xs">
              <MapPin size={11} className="text-amber-600" />
              <span>{selectedDistrict}</span>
              <button
                type="button"
                onClick={() => onDistrictSelect(null)}
                aria-label={`Remove ${selectedDistrict} filter`}
                className="flex h-3.5 w-3.5 items-center justify-center rounded text-amber-700 hover:text-amber-950 transition-colors"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── LEVEL 3: SEARCH BAR FOR MATHURA VILLAGES ── */}
      {isLevel3Mathura && (
        <div className="relative z-20 mt-2 px-1">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={villageSearchQuery}
              onChange={(e) => {
                setVillageSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search Mathura villages, hamlets & towns..."
              className="w-full rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-sm pl-8.5 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
            />
            {villageSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setVillageSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                aria-label="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-1 right-1 mt-1 z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white/98 p-1 shadow-lg backdrop-blur-md">
              {searchResults.map((village) => (
                <button
                  key={village.id}
                  type="button"
                  onClick={() => handleSelectVillageFromSearch(village)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-amber-600" />
                    <span className="font-semibold">{village.name}</span>
                  </div>
                  {village.place && (
                    <span className="text-[10px] text-slate-400 capitalize">{village.place}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FLOATING ZOOM CONTROLS ── */}
      <div className="absolute left-4 bottom-4 z-20 flex flex-col rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Plus size={14} strokeWidth={2.2} />
        </button>
        <div className="h-px w-full bg-slate-200" />
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Minus size={14} strokeWidth={2.2} />
        </button>
        <div className="h-px w-full bg-slate-200" />
        <button
          type="button"
          onClick={handleResetZoom}
          aria-label="Reset zoom"
          className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw size={12} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── MAP CANVAS DISPLAY ── */}
      <div
        className="relative flex flex-1 h-full min-h-[320px] w-full items-center justify-center my-2 rounded-xl overflow-hidden"
        role="region"
        aria-label={isLevel3Mathura ? 'Mathura District Map' : 'India & State Map'}
      >
        {/* ────────────────────────────────────────────────────────── */}
        {/* LEVEL 3: MATHURA DISTRICT MAPLIBRE OSM TILES & REAL GEOJSON */}
        {/* ────────────────────────────────────────────────────────── */}
        {isLevel3Mathura ? (
          <div className="relative h-full w-full min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-[#F2EFE9]">
            {/* Loading Shimmer Skeleton */}
            {isLoadingLevel3 && (
              <div
                data-testid="map-loading-shimmer"
                className="absolute inset-0 z-10 animate-pulse bg-slate-100/90 border border-slate-200/60 flex items-center justify-center transition-opacity"
              >
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                  <Layers size={13} className="text-amber-600 animate-spin" />
                  Loading Mathura district boundaries & village points...
                </div>
              </div>
            )}

            <Map
              ref={mapRef}
              mapLib={maplibregl}
              initialViewState={{
                longitude: MATHURA_CENTER.longitude,
                latitude: MATHURA_CENTER.latitude,
                zoom: MATHURA_INITIAL_ZOOM,
              }}
              minZoom={MATHURA_MIN_ZOOM}
              maxZoom={MATHURA_MAX_ZOOM}
              maxBounds={MATHURA_MAX_BOUNDS}
              mapStyle={OSM_MAP_STYLE}
              onLoad={() => setIsLoadingLevel3(false)}
              onError={() => setIsLoadingLevel3(false)}
              cursor={cursorStyle}
              interactiveLayerIds={['clusters', 'unclustered-point', 'unclustered-label']}
              onClick={handleMapClick}
              onMouseEnter={handleMouseEnterLayer}
              onMouseLeave={handleMouseLeaveLayer}
              attributionControl={{ compact: true }}
              style={{ width: '100%', height: '100%' }}
            >
              {/* 1. Tehsil Boundary Polygon Overlay */}
              <Source id="mathura-tehsils-source" type="geojson" data="/data/geo/mathura-tehsils.geojson">
                <Layer
                  id="tehsil-fill-layer"
                  type="fill"
                  paint={{
                    'fill-color': '#F2B705',
                    'fill-opacity': 0.1,
                  }}
                />
                <Layer
                  id="tehsil-line-layer"
                  type="line"
                  paint={{
                    'line-color': '#D97706',
                    'line-width': 1.5,
                    'line-opacity': 0.85,
                  }}
                />
                <Layer
                  id="tehsil-labels-layer"
                  type="symbol"
                  filter={['has', 'name']}
                  maxzoom={13}
                  layout={{
                    'text-field': ['get', 'name'],
                    'text-size': 12,
                    'text-transform': 'uppercase',
                  }}
                  paint={{
                    'text-color': '#78350F',
                    'text-halo-color': '#FFFFFF',
                    'text-halo-width': 2,
                  }}
                />
              </Source>

              {/* 2. Village Point Features with Native MapLibre Clustering */}
              <Source
                id="mathura-villages-source"
                type="geojson"
                data="/data/geo/mathura-villages.geojson"
                cluster={true}
                clusterMaxZoom={14}
                clusterRadius={50}
              >
                <Layer
                  id="clusters"
                  type="circle"
                  filter={['has', 'point_count']}
                  paint={{
                    'circle-color': [
                      'step',
                      ['get', 'point_count'],
                      '#F59E0B',
                      15,
                      '#D97706',
                      40,
                      '#B45309',
                    ],
                    'circle-radius': [
                      'step',
                      ['get', 'point_count'],
                      16,
                      15,
                      20,
                      40,
                      26,
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#FFFFFF',
                  }}
                />

                <Layer
                  id="cluster-count"
                  type="symbol"
                  filter={['has', 'point_count']}
                  layout={{
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-size': 11,
                  }}
                  paint={{
                    'text-color': '#FFFFFF',
                  }}
                />

                <Layer
                  id="unclustered-point"
                  type="circle"
                  filter={['!', ['has', 'point_count']]}
                  minzoom={11}
                  paint={{
                    'circle-color': '#F59E0B',
                    'circle-radius': 5.5,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#78350F',
                  }}
                />

                <Layer
                  id="unclustered-label"
                  type="symbol"
                  filter={['!', ['has', 'point_count']]}
                  minzoom={12.5}
                  layout={{
                    'text-field': ['get', 'name'],
                    'text-size': 11,
                    'text-offset': [0, 1.2],
                    'text-anchor': 'top',
                  }}
                  paint={{
                    'text-color': '#1E293B',
                    'text-halo-color': '#FFFFFF',
                    'text-halo-width': 1.5,
                  }}
                />
              </Source>
            </Map>

            {/* Hover Tooltip for Individual Villages on Map */}
            {hoveredVillage && (
              <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber-600" />
                  <span className="text-xs font-bold text-slate-900">{hoveredVillage.name}</span>
                  {hoveredVillage.place && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 capitalize">
                      {hoveredVillage.place}
                    </span>
                  )}
                </div>
                {hoveredVillage.postalCode && (
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    PIN Code: <span className="font-semibold text-slate-700">{hoveredVillage.postalCode}</span>
                  </div>
                )}
                <span className="mt-1 text-[10px] text-slate-400">
                  Click point to select location in insights
                </span>
              </div>
            )}
          </div>
        ) : isLevel2UP && stateData ? (
          /* ────────────────────────────────────────────────────────── */
          /* LEVEL 2: UTTAR PRADESH STATE DISTRICT MAP (SVG VECTOR)     */
          /* ────────────────────────────────────────────────────────── */
          <div className="relative flex h-full w-full items-center justify-center">
            <svg
              viewBox={stateData.viewBox}
              preserveAspectRatio="xMidYMid meet"
              className="h-full max-h-[440px] w-full transition-transform duration-200"
              style={{ transform: `scale(${svgZoomLevel})` }}
              role="img"
              aria-label="Uttar Pradesh District Map"
            >
              {/* UP District Polygons */}
              <g id="state-districts">
                {stateData.districts.map((district) => {
                  const isMathura =
                    district.name.toLowerCase().includes('mathura') ||
                    district.id.toLowerCase().includes('mathura');

                  return (
                    <path
                      key={district.id}
                      id={`dist-${district.id}`}
                      d={district.path}
                      aria-label={district.name}
                      onClick={() => handleDistrictClick(district)}
                      onMouseEnter={() => setHoveredDistrictLocation(district)}
                      onMouseLeave={() => setHoveredDistrictLocation(null)}
                      className={cn(
                        'transition-all duration-150 focus:outline-none',
                        isMathura
                          ? 'cursor-pointer fill-[#FEF3C7] stroke-[#D97706] stroke-[2.5] hover:fill-[#FDE68A]'
                          : 'cursor-not-allowed fill-[#F8FAFC] stroke-[#CBD5E1] stroke-[1] hover:fill-[#F1F5F9]'
                      )}
                    >
                      <title>
                        {isMathura
                          ? `${district.name} — Active Pilot Region (Click to drill in)`
                          : `${district.name} — Coming Soon`}
                      </title>
                    </path>
                  );
                })}
              </g>

              {/* Mathura District Permanent Highlight Marker & Pilot Badge */}
              <g id="district-pins" className="pointer-events-none">
                {stateData.districts.map((district) => {
                  const isMathura =
                    district.name.toLowerCase().includes('mathura') ||
                    district.id.toLowerCase().includes('mathura');

                  if (!isMathura) return null;

                  return (
                    <g
                      key={`pin-${district.id}`}
                      transform={`translate(${district.center.x}, ${district.center.y})`}
                      className="pointer-events-auto cursor-pointer"
                      onClick={() => handleDistrictClick(district)}
                      onMouseEnter={() => setHoveredDistrictLocation(district)}
                      onMouseLeave={() => setHoveredDistrictLocation(null)}
                      role="button"
                      tabIndex={0}
                      aria-label="Pin for Mathura (Pilot Region)"
                    >
                      {/* Animated Pulse Ring */}
                      <circle
                        r={16}
                        className="animate-ping fill-amber-500 opacity-40"
                      />

                      {/* Outer Pin Body */}
                      <circle
                        r={9}
                        className="fill-amber-600 stroke-white stroke-[2] shadow-md"
                      />

                      {/* Inner Dot */}
                      <circle r={3.5} className="fill-white" />

                      {/* Permanent Attached Label Badge */}
                      <g transform="translate(14, -6)" className="pointer-events-none select-none">
                        <rect
                          x={-2}
                          y={-10}
                          width={68}
                          height={16}
                          rx={4}
                          className="fill-amber-900/90 stroke-white stroke-[1]"
                        />
                        <text
                          x={32}
                          y={1}
                          textAnchor="middle"
                          className="text-[8.5px] font-bold fill-white tracking-tight"
                        >
                          PILOT REGION
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Hover Tooltip for UP Districts */}
            {hoveredDistrictLocation && (
              <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md">
                {hoveredDistrictLocation.name.toLowerCase().includes('mathura') ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900">Mathura District</span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                        ★ PILOT REGION
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] font-medium text-amber-700">
                      Click to explore Mathura tehsils, villages & blocks (OSM Map)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Lock size={12} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">{hoveredDistrictLocation.name}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500">
                        Coming Soon
                      </span>
                    </div>
                    <span className="mt-0.5 text-[10px] text-slate-400">
                      Pilot active in Mathura district &bull; State rollout planned post-MVP
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────── */
          /* LEVEL 1: ALL-INDIA NATIONAL OPPORTUNITIES HEATMAP          */
          /* ────────────────────────────────────────────────────────── */
          <div className="relative flex h-full w-full items-center justify-center">
            <svg
              viewBox={INDIA_VIEWBOX}
              preserveAspectRatio="xMidYMid meet"
              className="h-full max-h-[440px] w-full transition-transform duration-200"
              style={{ transform: `scale(${svgZoomLevel})` }}
              role="img"
              aria-label="Interactive India Map"
            >
              <g id="india-states">
                {INDIA_STATES.map((state: MapLocation) => {
                  const profile = getStateOpportunityProfile(state.name);
                  const isSelected =
                    selectedState &&
                    (selectedState.toLowerCase() === state.name.toLowerCase() ||
                      selectedState.toLowerCase() === state.id.toLowerCase());
                  const colors = getOpportunityLevelColor(profile.opportunityLevel);

                  return (
                    <path
                      key={state.id}
                      id={state.id}
                      d={state.path}
                      aria-label={state.name}
                      onClick={() => handleStateClick(state)}
                      onMouseEnter={() => setHoveredState(state)}
                      onMouseLeave={() => setHoveredState(null)}
                      fill={isSelected ? '#15803D' : colors.fill}
                      stroke={isSelected ? '#0F5132' : colors.stroke}
                      strokeWidth={isSelected ? 2.5 : 1}
                      className={cn(
                        'cursor-pointer transition-all duration-150 focus:outline-none',
                        isSelected
                          ? 'filter drop-shadow-[0_2px_8px_rgba(21,128,61,0.4)]'
                          : 'hover:brightness-95'
                      )}
                    >
                      <title>{`${state.name} — ${profile.opportunityLevel} Opportunity`}</title>
                    </path>
                  );
                })}
              </g>
            </svg>

            {/* Hover Tooltip for India States */}
            {hoveredState && (
              <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md">
                {hoveredState.id === 'up' || hoveredState.name.toLowerCase().includes('uttar pradesh') ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900">Uttar Pradesh</span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                        ACTIVE PILOT
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] font-medium text-emerald-700">
                      Click to explore Mathura pilot district
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{hoveredState.name}</span>
                      {hoveredState && (
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.2 text-[9px] font-bold',
                            getStateOpportunityProfile(hoveredState.name).opportunityLevel === 'High' && 'bg-emerald-100 text-emerald-800',
                            getStateOpportunityProfile(hoveredState.name).opportunityLevel === 'Medium' && 'bg-green-100 text-green-800',
                            getStateOpportunityProfile(hoveredState.name).opportunityLevel === 'Emerging' && 'bg-emerald-50 text-emerald-700',
                            getStateOpportunityProfile(hoveredState.name).opportunityLevel === 'Lower' && 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {getStateOpportunityProfile(hoveredState.name).opportunityLevel} Opportunity
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 text-[10px] text-slate-400">
                      Click state to inspect market metrics
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM HELPER / OPPORTUNITY LEGEND BAR ── */}
      <div className="mt-1 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-100/90 pt-2 px-1">
        {isLevel3Mathura ? (
          <span>Level 3: Mathura District (OpenStreetMap • Real Tehsil & Village GeoJSON)</span>
        ) : isLevel2UP ? (
          <span>Level 2: Uttar Pradesh (Mathura Pilot District Active • Other districts coming soon)</span>
        ) : (
          <div className="flex flex-wrap items-center justify-between w-full">
            <span className="font-semibold text-slate-700">Opportunity Level Heatmap:</span>
            <div className="flex items-center gap-3 mt-1 sm:mt-0">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#15803D]" />
                <span className="text-slate-700 font-medium">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#4ADE80]" />
                <span className="text-slate-700 font-medium">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#BBF7D0]" />
                <span className="text-slate-700 font-medium">Emerging</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#E2E8F0]" />
                <span className="text-slate-700 font-medium">Lower</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
