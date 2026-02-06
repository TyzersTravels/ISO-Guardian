import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ResellerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resellerData, setResellerData] = useState(null);
  const [clients, setClients] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResellerData();
  }, [user]);

  const fetchResellerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get reseller info - using .select() returns array, we need single()
      const { data: resellerInfo, error: resellerError } = await supabase
        .from('resellers')
        .select('*')
        .eq('contact_email', user?.email)
        .single(); // This is the fix - single() not array

      if (resellerError) {
        // If no reseller found, user doesn't have access
        if (resellerError.code === 'PGRST116') {
          setError('Reseller access required. Contact support to enable reseller features.');
          setLoading(false);
          return;
        }
        throw resellerError;
      }

      if (!resellerInfo) {
        setError('Reseller access required. Contact support to enable reseller features.');
        setLoading(false);
        return;
      }

      setResellerData(resellerInfo);

      // Get clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('reseller_clients')
        .select('*')
        .eq('reseller_id', resellerInfo.id)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Get commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('reseller_commissions')
        .select('*')
        .eq('reseller_id', resellerInfo.id)
        .order('period_start', { ascending: false });

      if (commissionsError) throw commissionsError;
      setCommissions(commissionsData || []);

    } catch (err) {
      console.error('Error fetching reseller data:', err);
      setError('Failed to load reseller data: ' + err.message);
    } finally {
      setLoading(false);
    }
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
            <div className="text-6xl mb-4">🔒</div>
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
        <div>
          <h1 className="text-3xl font-bold text-white">Reseller Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">
            {resellerData?.reseller_name} • Partner since {new Date(resellerData?.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Status Badge */}
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {activeClients}
            </div>
            <div className="text-sm text-cyan-200">Active Clients</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-500/30 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              R{calculateTotalMRR().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-green-200">Total MRR</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-500/30 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              R{calculateTotalCommission().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-purple-200">Your Commission</div>
          </div>
        </div>

        {/* Progress to 10 Clients */}
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
              ? '🎉 Milestone reached! Contact us to discuss extended partnership benefits.'
              : `${10 - activeClients} more client${10 - activeClients === 1 ? '' : 's'} to unlock milestone benefits`
            }
          </p>
        </div>

        {/* Clients List */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">Your Clients</h3>
          
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
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
                        <span>📋 {client.subscription_tier}</span>
                        <span>📅 Onboarded: {new Date(client.onboarded_date || client.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white mb-1">
                        R{parseFloat(client.mrr || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-green-400">
                        +R{(parseFloat(client.mrr || 0) * (resellerData?.commission_rate || 0.25)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} comm.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Internal Discount Info */}
        {resellerData?.internal_discount > 0 && (
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-lg border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎁</div>
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">Partner Admin Discount</h3>
                <p className="text-sm text-white/70 mb-3">
                  You receive a {(resellerData.internal_discount * 100).toFixed(0)}% discount on your own internal platform usage.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Standard: </span>
                    <span className="text-white line-through">R5,000/month</span>
                  </div>
                  <div>
                    <span className="text-white/60">Your Price: </span>
                    <span className="text-green-400 font-semibold">R2,500/month</span>
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-2">
                  This discount applies for 6 months or until you reach 10 active clients, whichever comes first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Commission History */}
        {commissions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Commission History</h3>
            <div className="space-y-2">
              {commissions.map((comm) => (
                <div 
                  key={comm.id}
                  className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-lg"
                >
                  <div>
                    <div className="text-sm text-white">
                      {new Date(comm.period_start).toLocaleDateString()} - {new Date(comm.period_end).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-white/50">
                      MRR: R{parseFloat(comm.mrr_amount || 0).toLocaleString('en-ZA')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-400">
                      R{parseFloat(comm.commission_amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs ${
                      comm.status === 'Paid' ? 'text-green-400' : 
                      comm.status === 'Pending' ? 'text-orange-400' : 'text-white/50'
                    }`}>
                      {comm.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResellerDashboard;
