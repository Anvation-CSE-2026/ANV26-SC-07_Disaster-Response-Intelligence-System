import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const res = await api.fetchResources();
      if (res) {
        setTeams(res.filter(r => r.type === 'rescue_team'));
      }
    };
    fetchTeams();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">DRIS</h1>
        <h2 className="mt-2 text-xl font-medium text-gray-900">Disaster Response Intelligence System</h2>
        <p className="mt-1 text-sm text-gray-500">Team: WINMAC CODE | ANV26-SC-07</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border">
          <h3 className="text-lg font-medium text-center mb-6">Select Your Role</h3>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Admin / Authority
            </button>
            
            <div className="flex flex-col gap-2 p-3 border rounded-md bg-gray-50">
              <label className="text-xs font-medium text-gray-500 uppercase">Select Rescue Team</label>
              <div className="flex gap-2">
                <select 
                  id="team-select" 
                  className="flex-1 border-gray-300 rounded-md shadow-sm text-sm"
                  defaultValue=""
                >
                  {teams.length > 0 ? (
                    teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  ) : (
                    <option value="1">Team 01 (Fallback)</option>
                  )}
                </select>
                <button
                  onClick={() => {
                    const teamId = document.getElementById('team-select').value;
                    localStorage.setItem('dris_team_id', teamId);
                    navigate('/rescue');
                  }}
                  className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100"
                >
                  Login
                </button>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/citizen')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Citizen
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400 uppercase tracking-widest">Prototype — Simulated Data Only</p>
      </div>
    </div>
  );
}
