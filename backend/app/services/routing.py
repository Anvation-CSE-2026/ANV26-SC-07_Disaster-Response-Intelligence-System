import requests

def get_route(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> dict:
    url = f"http://router.project-osrm.org/route/v1/driving/{from_lng},{from_lat};{to_lng},{to_lat}?overview=full&geometries=geojson"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data['code'] == 'Ok':
                route = data['routes'][0]
                return {
                    'geometry': route['geometry'],
                    'distance_km': route['distance'] / 1000.0,
                    'duration_min': route['duration'] / 60.0
                }
    except Exception as e:
        print(f"OSRM Routing failed: {e}")
        
    # Fallback straight line route
    return {
        'geometry': {
            'type': 'LineString',
            'coordinates': [[from_lng, from_lat], [to_lng, to_lat]]
        },
        'distance_km': 0,
        'duration_min': 0
    }
