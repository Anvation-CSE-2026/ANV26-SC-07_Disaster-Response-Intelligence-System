import math
from sqlalchemy.orm import Session
from app.models.models import Resource, Zone, ResourceAssignment
from app.services.priority import calculate_priorities

try:
    from ortools.sat.python import cp_model
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def optimize_allocation(db: Session) -> dict:
    # Clear previous assignments and reset resource statuses
    db.query(ResourceAssignment).delete()
    for r in db.query(Resource).filter(Resource.status == 'assigned').all():
        r.status = 'available'
        r.assigned_zone_id = None
    db.commit()

    priorities = calculate_priorities(db)
    resources = db.query(Resource).filter(Resource.status == 'available').all()
    zones = {z.id: z for z in db.query(Zone).all()}
    
    # Filter zones that need resources
    zones_needing_help = [p for p in priorities if p['recommended_resource_type'] != 'none']
    
    assignments_list = []
    unmet_zones = []

    if not ORTOOLS_AVAILABLE:
        # Greedy assignment fallback
        assignments_list = []
        assigned_zones = set()
        
        # Sort priorities descending
        zones_needing_help.sort(key=lambda x: x['priority_score'], reverse=True)
        
        # For each zone, find the closest compatible available resource
        for pzone in zones_needing_help:
            z = zones[pzone['zone_id']]
            best_res = None
            best_dist = float('inf')
            
            for i, res in enumerate(resources):
                if res.status != 'available':
                    continue
                if res.type != pzone['recommended_resource_type']:
                    continue
                    
                dist = haversine_distance(res.latitude, res.longitude, z.latitude, z.longitude)
                if dist < best_dist:
                    best_dist = dist
                    best_res = res
                    
            if best_res:
                assignment = ResourceAssignment(
                    resource_id=best_res.id,
                    zone_id=pzone['zone_id'],
                    priority=len(assigned_zones) + 1,
                    status='recommended',
                    reason=f"Greedy match: distance {best_dist:.1f}km"
                )
                db.add(assignment)
                
                best_res.assigned_zone_id = pzone['zone_id']
                best_res.status = 'assigned'
                
                assignments_list.append({
                    'resource_id': best_res.id,
                    'zone_id': pzone['zone_id'],
                    'reason': assignment.reason
                })
                assigned_zones.add(pzone['zone_id'])

        db.commit()
        unmet_zones = [z['zone_id'] for z in zones_needing_help if z['zone_id'] not in assigned_zones]
        
        return {
            'assignments': assignments_list,
            'unmet_zones': unmet_zones
        }

    model = cp_model.CpModel()
    
    num_r = len(resources)
    num_z = len(zones_needing_help)
    
    if num_r == 0 or num_z == 0:
        return {'assignments': [], 'unmet_zones': [z['zone_id'] for z in zones_needing_help]}

    # x[i, j] = 1 if resource i is assigned to zone j
    x = {}
    costs = {}
    
    for i, res in enumerate(resources):
        for j, pzone in enumerate(zones_needing_help):
            x[i, j] = model.NewBoolVar(f'x_{i}_{j}')
            
            z = zones[pzone['zone_id']]
            dist = haversine_distance(res.latitude, res.longitude, z.latitude, z.longitude)
            
            # Cost factor
            cost = int(dist * 10) 
            
            # Compatibility penalty
            if res.type != pzone['recommended_resource_type']:
                cost += 10000  # High penalty for wrong type
                
            # Priority reward (negative cost to prioritize higher priority)
            cost -= int(pzone['priority_score'] * 100)
            
            costs[i, j] = cost

    # Each resource assigned to at most one zone
    for i in range(num_r):
        model.AddAtMostOne(x[i, j] for j in range(num_z))
        
    # Each zone gets at most one resource (for simplicity in this prototype)
    for j in range(num_z):
        model.AddAtMostOne(x[i, j] for i in range(num_r))

    objective_terms = []
    for i in range(num_r):
        for j in range(num_z):
            objective_terms.append(costs[i, j] * x[i, j])
            
    model.Minimize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    status = solver.Solve(model)

    assigned_zones = set()

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        for i in range(num_r):
            for j in range(num_z):
                if solver.Value(x[i, j]):
                    res = resources[i]
                    pzone = zones_needing_help[j]
                    
                    assignment = ResourceAssignment(
                        resource_id=res.id,
                        zone_id=pzone['zone_id'],
                        priority=j+1,
                        status='recommended',
                        reason=f"Optimal match: distance {haversine_distance(res.latitude, res.longitude, zones[pzone['zone_id']].latitude, zones[pzone['zone_id']].longitude):.1f}km"
                    )
                    db.add(assignment)
                    
                    res.assigned_zone_id = pzone['zone_id']
                    res.status = 'assigned'
                    
                    assignments_list.append({
                        'resource_id': res.id,
                        'zone_id': pzone['zone_id'],
                        'reason': assignment.reason
                    })
                    assigned_zones.add(pzone['zone_id'])
    
    db.commit()
    
    for z in zones_needing_help:
        if z['zone_id'] not in assigned_zones:
            unmet_zones.append(z['zone_id'])

    return {
        'assignments': assignments_list,
        'unmet_zones': unmet_zones
    }
