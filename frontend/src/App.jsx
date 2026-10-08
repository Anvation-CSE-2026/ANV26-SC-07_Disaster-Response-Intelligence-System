import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import RiskZones from './pages/admin/RiskZones';
import PriorityQueue from './pages/admin/PriorityQueue';
import Resources from './pages/admin/Resources';
import ResponseTeams from './pages/admin/ResponseTeams';
import Predictions from './pages/admin/Predictions';
import Alerts from './pages/admin/Alerts';
import MapPage from './pages/admin/MapPage';
import ScenarioSimulator from './pages/admin/ScenarioSimulator';
import Reports from './pages/admin/Reports';
import UserRequests from './pages/admin/UserRequests';

import RescueLayout from './pages/rescue/RescueLayout';
import RescueDashboard from './pages/rescue/RescueDashboard';
import RescueMap from './pages/rescue/RescueMap';
import RescueStatus from './pages/rescue/RescueStatus';
import RescueAlerts from './pages/rescue/RescueAlerts';

import CitizenLayout from './pages/citizen/CitizenLayout';
import CitizenHome from './pages/citizen/CitizenHome';
import CitizenAlerts from './pages/citizen/CitizenAlerts';
import CitizenHelp from './pages/citizen/CitizenHelp';
import CitizenShelter from './pages/citizen/CitizenShelter';
import CitizenSafeRoute from './pages/citizen/CitizenSafeRoute';
import CitizenReport from './pages/citizen/CitizenReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="zones" element={<RiskZones />} />
          <Route path="priorities" element={<PriorityQueue />} />
          <Route path="resources" element={<Resources />} />
          <Route path="teams" element={<ResponseTeams />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="map" element={<MapPage />} />
          <Route path="simulator" element={<ScenarioSimulator />} />
          <Route path="reports" element={<Reports />} />
          <Route path="requests" element={<UserRequests />} />
        </Route>

        {/* Rescue Routes */}
        <Route path="/rescue" element={<RescueLayout />}>
          <Route index element={<RescueDashboard />} />
          <Route path="map" element={<RescueMap />} />
          <Route path="status" element={<RescueStatus />} />
          <Route path="alerts" element={<RescueAlerts />} />
        </Route>

        {/* Citizen Routes */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenHome />} />
          <Route path="alerts" element={<CitizenAlerts />} />
          <Route path="help" element={<CitizenHelp />} />
          <Route path="shelter" element={<CitizenShelter />} />
          <Route path="route" element={<CitizenSafeRoute />} />
          <Route path="report" element={<CitizenReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
