import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import { MapPin, Send, CheckCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';

export default function UserRequests() {
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, dispatched, resolved
  const [dispatching, setDispatching] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  
  const { lastMessage } = useWebSocket('admin');

  const loadData = async () => {
    const data = await api.fetchHelpRequests();
    const resData = await api.fetchResources();
    if (data) setRequests(data);
    if (resData) setResources(resData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (lastMessage) loadData(); }, [lastMessage]);

  const handleDispatch = async (id) => {
    setDispatching(id);
    const result = await api.dispatchRequest(id);
    if (result) {
      loadData();
    } else {
      alert('No available rescue resources to dispatch!');
    }
    setDispatching(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    await api.deleteHelpRequest(id);
    loadData();
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} requests?`)) return;
    setDeleting(true);
    for (const id of selectedIds) {
      await api.deleteHelpRequest(id);
    }
    setSelectedIds([]);
    setDeleting(false);
    loadData();
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (filteredReqs) => {
    if (selectedIds.length === filteredReqs.length && filteredReqs.length > 0) {
      setSelectedIds([]); // Deselect all
    } else {
      setSelectedIds(filteredReqs.map(r => r.id)); // Select all
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const statusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-red-500" />;
      case 'dispatched': return <Send className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800 border-red-200';
      case 'dispatched': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <LoadingSpinner />;

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const dispatchedCount = requests.filter(r => r.status === 'dispatched').length;
  const resolvedCount = requests.filter(r => r.status === 'resolved').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">User Help Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and dispatch citizen emergency requests to rescue teams</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
            <span className="font-bold text-red-700">{pendingCount}</span> <span className="text-red-600">Pending</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            <span className="font-bold text-blue-700">{dispatchedCount}</span> <span className="text-blue-600">Dispatched</span>
          </div>
          <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
            <span className="font-bold text-green-700">{resolvedCount}</span> <span className="text-green-600">Resolved</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex justify-between items-center bg-white p-3 border rounded-lg shadow-sm">
        <div className="flex gap-2">
          {['all', 'pending', 'dispatched', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg border capitalize ${
                filter === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300"
              checked={selectedIds.length === filtered.length && filtered.length > 0}
              onChange={() => toggleSelectAll(filtered)}
            />
            <span className="text-gray-700 font-medium">Select All</span>
          </label>
          <button
            disabled={selectedIds.length === 0 || deleting}
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">No {filter === 'all' ? '' : filter} requests found.</div>
        )}
        {filtered.map(req => (
          <div key={req.id} className={`bg-white border rounded-lg shadow-sm overflow-hidden ${req.status === 'pending' ? 'border-l-4 border-l-red-500' : req.status === 'dispatched' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'}`}>
            <div className="p-4 flex gap-3">
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  checked={selectedIds.includes(req.id)}
                  onChange={() => toggleSelect(req.id)}
                />
              </div>
              <div className="flex-1 flex justify-between items-start">
                {/* Left: User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center font-bold text-gray-600">
                      {(req.citizen_name || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{req.citizen_name || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">User ID: #{req.citizen_id || 'N/A'} • Request #{req.id}</div>
                    </div>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border flex items-center gap-1 ${statusColor(req.status)}`}>
                      {statusIcon(req.status)} {req.status}
                    </span>
                  </div>

                  <div className="ml-13 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded capitalize">{req.type.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-400">in</span>
                      <span className="text-sm font-medium text-gray-700">{req.zone_name}</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border italic">
                      "{req.description || 'No message provided'}"
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>Location: {req.latitude?.toFixed(4)}, {req.longitude?.toFixed(4)}</span>
                      <span className="mx-2">•</span>
                      <span>{(() => {
                        let raw = req.created_at;
                        if (!raw) return '';
                        if (!String(raw).endsWith('Z')) raw = raw + 'Z';
                        const d = new Date(raw);
                        return isNaN(d) ? '' : d.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      })()}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col items-end gap-2 ml-4">
                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleDispatch(req.id)}
                      disabled={dispatching === req.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      {dispatching === req.id ? 'Dispatching...' : 'Dispatch to Rescue'}
                    </button>
                  )}
                  {req.status === 'dispatched' && req.resource_name && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Assigned to</div>
                      <div className="font-bold text-blue-700 text-sm">{req.resource_name}</div>
                      {(() => {
                        const res = resources.find(r => r.id === req.assigned_resource_id);
                        if (!res) return null;
                        const sColor = res.status === 'on_site' ? 'text-amber-600 bg-amber-50' : 
                                       res.status === 'busy' ? 'text-red-600 bg-red-50' : 
                                       res.status === 'available' ? 'text-green-600 bg-green-50' :
                                       'text-blue-600 bg-blue-50';
                        return (
                          <div className={`text-[10px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded inline-block ${sColor}`}>
                            Team Status: {res.status.replace('_', ' ')}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {req.status === 'resolved' && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Completed</div>
                      <div className="font-bold text-green-700 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Done
                      </div>
                      {req.resolved_at && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {(() => {
                            let raw = req.resolved_at;
                            if (!raw) return '';
                            if (!String(raw).endsWith('Z')) raw = raw + 'Z';
                            const d = new Date(raw);
                            return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                  <button 
                    onClick={() => handleDelete(req.id)}
                    className="mt-2 text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                    title="Delete Request"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
