<script lang="ts">
  import { onMount } from 'svelte';

  interface Place {
    id: string;
    name: string;
    type: string;
    distance: number;
    lat: number;
    lon: number;
    source: 'wikipedia' | 'osm';
    url?: string;
  }

  let places: Place[] = [];
  let loading = false;
  let error = '';
  let userLat: number | null = null;
  let userLon: number | null = null;
  
  let searchRadius = 2000; // in meters
  let searchType = 'attractions'; // default search type

  // Haversine formula to calculate distance in meters
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  async function fetchWikipediaPlaces(lat: number, lon: number, radius: number): Promise<Place[]> {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${radius}&gslimit=50&format=json&origin=*`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.query || !data.query.geosearch) return [];
      
      return data.query.geosearch.map((item: any) => ({
        id: `wiki-${item.pageid}`,
        name: item.title,
        type: 'Wikipedia Article',
        distance: item.dist,
        lat: item.lat,
        lon: item.lon,
        source: 'wikipedia',
        url: `https://en.wikipedia.org/?curid=${item.pageid}`
      }));
    } catch (e) {
      console.error("Wikipedia API error:", e);
      return [];
    }
  }

  async function fetchOSMPlaces(lat: number, lon: number, radius: number, type: string): Promise<Place[]> {
    let typeQuery = '';
    
    if (type === 'attractions') {
      typeQuery = `
        node["tourism"~"attraction|museum|viewpoint|gallery"](around:${radius},${lat},${lon});
        node["historic"](around:${radius},${lat},${lon});
      `;
    } else if (type === 'restaurants') {
      typeQuery = `node["amenity"~"restaurant|cafe|fast_food|bar"](around:${radius},${lat},${lon});`;
    } else if (type === 'hotels') {
      typeQuery = `node["tourism"~"hotel|hostel|guest_house|motel"](around:${radius},${lat},${lon});`;
    } else if (type === 'shopping') {
      typeQuery = `node["shop"~"mall|department_store|supermarket|convenience"](around:${radius},${lat},${lon});`;
    } else {
      // 'all'
      typeQuery = `
        node["tourism"~"attraction|museum|viewpoint|gallery|hotel"](around:${radius},${lat},${lon});
        node["historic"](around:${radius},${lat},${lon});
        node["amenity"~"restaurant|cafe"](around:${radius},${lat},${lon});
        node["shop"~"mall|supermarket"](around:${radius},${lat},${lon});
      `;
    }

    const query = `
      [out:json][timeout:25];
      (
        ${typeQuery}
      );
      out body;
      >;
      out skel qt;
    `;
    
    const url = `https://overpass-api.de/api/interpreter`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: query
      });
      const data = await res.json();
      if (!data.elements) return [];
      
      return data.elements
        .filter((el: any) => el.tags && el.tags.name)
        .map((el: any) => ({
          id: `osm-${el.id}`,
          name: el.tags.name || el.tags['name:en'] || 'Unknown Landmark',
          type: el.tags.tourism || el.tags.amenity || el.tags.shop || el.tags.historic || 'Place',
          distance: calculateDistance(lat, lon, el.lat, el.lon),
          lat: el.lat,
          lon: el.lon,
          source: 'osm'
        }));
    } catch (e) {
      console.error("OSM API error:", e);
      return [];
    }
  }

  async function findNearby() {
    if (!navigator.geolocation) {
      error = "Geolocation is not supported by your browser.";
      return;
    }

    loading = true;
    error = '';
    places = [];

    navigator.geolocation.getCurrentPosition(async (position) => {
      userLat = position.coords.latitude;
      userLon = position.coords.longitude;

      try {
        const promises = [fetchOSMPlaces(userLat, userLon, searchRadius, searchType)];
        
        // Only fetch Wikipedia if we are looking for attractions or everything
        if (searchType === 'attractions' || searchType === 'all') {
          promises.push(fetchWikipediaPlaces(userLat, userLon, searchRadius));
        }

        const results = await Promise.all(promises);
        
        // Flatten results array
        const combined = results.flat();
        const uniquePlaces = new Map<string, Place>();
        
        combined.forEach(place => {
          const key = place.name.toLowerCase();
          if (!uniquePlaces.has(key) || uniquePlaces.get(key)!.source === 'osm') {
             if(uniquePlaces.has(key) && place.source === 'osm') return;
             uniquePlaces.set(key, place);
          }
        });

        places = Array.from(uniquePlaces.values()).sort((a, b) => a.distance - b.distance);
        
        if (places.length === 0) {
          error = `No places found within ${searchRadius >= 1000 ? searchRadius / 1000 + 'km' : searchRadius + 'm'}.`;
        }
      } catch (e) {
        error = "Failed to fetch data. Please try again.";
      } finally {
        loading = false;
      }
    }, (err) => {
      loading = false;
      error = `Unable to retrieve your location: ${err.message}`;
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }
</script>

<div class="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans selection:bg-red-200 p-4 sm:p-8">
  <div class="max-w-[720px] mx-auto">
    <a href="/my-itinerary/" class="inline-flex items-center text-[13px] text-[#888] hover:text-[#1A1A1A] transition-colors mb-4 sm:mb-6">
      <i class="ti ti-arrow-left mr-1"></i> Back to Itinerary
    </a>

    <h1 class="text-2xl sm:text-[40px] font-bold font-serif mb-1 sm:mb-2 leading-tight">
      Nearby Explorer
    </h1>
    <p class="text-[13px] sm:text-sm text-[#888] mb-5 sm:mb-8">Find attractions, restaurants, and more around you.</p>

    <!-- Compact Search Card -->
    <div class="bg-white border border-[#E8E5DE] rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
        
        <!-- Type Filter -->
        <div class="flex-1">
          <label for="type-select" class="block text-[12px] font-bold uppercase tracking-wider text-[#888] mb-1.5">Looking for</label>
          <select id="type-select" bind:value={searchType} disabled={loading} class="w-full bg-[#F2F0EB] border border-[#E8E5DE] text-[14px] rounded-lg px-3 py-2.5 outline-none focus:border-[#1A1A1A] transition-colors disabled:opacity-50">
            <option value="attractions">Attractions & Historic Sites</option>
            <option value="restaurants">Restaurants & Cafes</option>
            <option value="hotels">Hotels & Lodging</option>
            <option value="shopping">Shopping & Convenience</option>
            <option value="all">Everything</option>
          </select>
        </div>

        <!-- Distance Filter -->
        <div class="flex-1">
          <label for="radius-select" class="block text-[12px] font-bold uppercase tracking-wider text-[#888] mb-1.5">Distance</label>
          <select id="radius-select" bind:value={searchRadius} disabled={loading} class="w-full bg-[#F2F0EB] border border-[#E8E5DE] text-[14px] rounded-lg px-3 py-2.5 outline-none focus:border-[#1A1A1A] transition-colors disabled:opacity-50">
            <option value={500}>500 m (Walk)</option>
            <option value={1000}>1 km</option>
            <option value={2000}>2 km (Standard)</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km (Drive)</option>
          </select>
        </div>

        <!-- Search Button -->
        <button 
          on:click={findNearby} 
          disabled={loading}
          class="w-full sm:w-auto bg-[#1A1A1A] text-white px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 h-[42px] sm:h-auto">
          {#if loading}
            <i class="ti ti-loader animate-spin"></i> Searching
          {:else}
            <i class="ti ti-search"></i> Find
          {/if}
        </button>
      </div>

      {#if error}
        <div class="mt-3 text-[12px] text-[#C1361A] bg-[#F9EDE9] px-3 py-2 rounded-lg">
          {error}
        </div>
      {/if}
    </div>

    <!-- Results List -->
    {#if places.length > 0}
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-[15px] font-bold font-serif">Found {places.length} places</h3>
        <div class="text-[11px] text-[#888] uppercase tracking-wide">Nearest first</div>
      </div>

      <div class="flex flex-col gap-2.5">
        {#each places as place}
          <div class="bg-white border border-[#E8E5DE] rounded-lg p-3.5 flex items-center justify-between gap-3 hover:border-[#1A1A1A] transition-colors group shadow-sm">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <h4 class="text-[15px] font-bold text-[#1A1A1A] truncate">{place.name}</h4>
                <span class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F2F0EB] text-[#888] whitespace-nowrap">
                  {place.type.replace(/_/g, ' ')}
                </span>
              </div>
              <div class="flex items-center gap-3 text-[12px] text-[#888] flex-wrap">
                <span class="flex items-center gap-1 font-medium text-[#1A1A1A]">
                  <i class="ti {place.distance >= 2000 ? 'ti-car' : 'ti-walk'}"></i> {place.distance >= 1000 ? (place.distance / 1000).toFixed(1) + 'km' : place.distance + 'm'}
                </span>
                {#if place.url}
                  <a href={place.url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-[#1A4580] hover:underline">
                    <i class="ti ti-brand-wikipedia"></i> Wiki
                  </a>
                {/if}
              </div>
            </div>
            
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`} 
              target="_blank" 
              rel="noopener noreferrer"
              class="shrink-0 w-10 h-10 flex items-center justify-center bg-[#F2F0EB] hover:bg-[#E8E5DE] text-[#1A1A1A] rounded-full transition-colors"
              title="Get Directions">
              <i class="ti ti-location-share text-[18px]"></i>
            </a>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
