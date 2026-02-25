import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ResellerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resellerData, setResellerData] = useState(null);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkAccessAndFetch();
  }, [user]);

  const checkAccessAndFetch = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is superadmin
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (rolesError) throw rolesError;

      const hasSuperAdmin = roles?.some(r => r.role === 'super_admin') || userProfile?.email === 'krugerreece@gmail.com';
      setIsSuperAdmin(hasSuperAdmin);

      // SuperAdmin can see everything
      if (hasSuperAdmin) {
        await fetchAllResellerData();
      } else {
        // Regular users need to be resellers
        await fetchResellerData();
      }

    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResellerData = async () => {
    // Get all resellers and clients for superadmin
    const { data: allResellers, error: resellersError } = await supabase
      .from('resellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (resellersError) throw resellersError;

    // Get all clients
    const { data: allClients, error: clientsError } = await supabase
      .from('reseller_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) throw clientsError;

    // Set first reseller as active (or create aggregate view)
    setResellerData(allResellers?.[0] || null);
    setClients(allClients || []);
  };

  const fetchResellerData = async () => {
    const { data: resellerInfo, error: resellerError } = await supabase
      .from('resellers')
      .select('*')
      .eq('contact_email', user?.email)
      .single();

    if (resellerError) {
      if (resellerError.code === 'PGRST116') {
        setError('Reseller access required. Contact support.');
        return;
      }
      throw resellerError;
    }

    if (!resellerInfo) {
      setError('Reseller access required. Contact support.');
      return;
    }

    setResellerData(resellerInfo);

    const { data: clientsData, error: clientsError } = await supabase
      .from('reseller_clients')
      .select('*')
      .eq('reseller_id', resellerInfo.id)
      .order('created_at', { ascending: false });

    if (clientsError) throw clientsError;
    setClients(clientsData || []);
  };

  const calculateTotalMRR = () => {
    return clients
      .filter(c => c.status === 'Active')
      .reduce((sum, client) => sum + (parseFloat(client.mrr) || 0), 0);
  };

  const calculateTotalCommission = () => {
    const totalMRR = calculateTotalMRR();
    const commissionRate = resellerData?.commission_rate || 0.25;
    return totalMRR * commissionRate;
  };

  const activeClients = clients.filter(c => c.status === 'Active').length;
  const progressTo10 = Math.min((activeClients / 10) * 100, 100);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-white/70">Loading reseller data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Required</h2>
            <p className="text-white/70 mb-4">{error}</p>
            <a 
              href="mailto:krugerreece@gmail.com?subject=Reseller Access Request"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Contact Support
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-sm text-white/60 mt-1">
              {isSuperAdmin && <span className="text-cyan-400 mr-2">SuperAdmin Access</span>}
              {resellerData?.reseller_name}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {resellerData && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  resellerData?.status === 'Good Standing' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <div>
                  <div className="text-sm text-white/60">Partnership Status</div>
                  <div className="font-semibold text-white">{resellerData?.status || 'Active'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60">Commission Rate</div>
                <div className="font-semibold text-cyan-400 text-lg">
                  {((resellerData?.commission_rate || 0.25) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-cyan-200">Active Clients</div>
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-white">{activeClients}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-green-200">Total MRR</div>
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-white">
              R{calculateTotalMRR().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-purple-200">Your Commission</div>
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-white">
              R{calculateTotalCommission().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Progress to 10 Clients */}
        {resellerData && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">Progress to 10 Clients Milestone</h3>
              <span className="text-sm text-white/60">{activeClients}/10 clients</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progressTo10}%` }}
              />
            </div>
            <p className="text-xs text-white/50 mt-2">
              {activeClients >= 10 
                ? 'Milestone reached! Contact us to discuss extended partnership benefits.'
                : `${10 - activeClients} more client${10 - activeClients === 1 ? '' : 's'} to unlock milestone benefits`
              }
            </p>
          </div>
        )}

        {/* Clients List */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">
            {isSuperAdmin ? 'All Clients' : 'Your Clients'}
          </h3>
          
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-white/70 mb-4">No clients yet</p>
              <p className="text-sm text-white/50">Clients you onboard will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <div 
                  key={client.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{client.client_name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          client.status === 'Active' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {client.status}
                        </span>
                      </div>
                      <div className="text-sm text-white/60 mb-2">
                        {client.client_email || client.client_company_id}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>{client.subscription_tier}</span>
                        <span>•</span>
                        <span>Onboarded: {new Date(client.onboarded_date || client.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white mb-1">
                        R{parseFloat(client.mrr || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-green-400">
                        +R{(parseFloat(client.mrr || 0) * (resellerData?.commission_rate || 0.25)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} commission
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResellerDashboard;
