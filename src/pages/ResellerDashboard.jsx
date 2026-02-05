import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ResellerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reseller, setReseller] = useState(null);
  const [clients, setClients] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalMRR: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    milestone10Reached: false
  });

  useEffect(() => {
    fetchResellerData();
  }, []);

  const fetchResellerData = async () => {
    try {
      setLoading(true);
      
      // Get reseller record
      const { data: resellerData, error: resellerError } = await supabase
        .from('resellers')
        .select('*')
        .eq('company_id', user?.user_metadata?.company_id)
        .single();

      if (resellerError) throw resellerError;
      setReseller(resellerData);

      // Get clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('reseller_clients')
        .select('*')
        .eq('reseller_id', resellerData.id)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Get commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('reseller_commissions')
        .select('*')
        .eq('reseller_id', resellerData.id)
        .order('period_start', { ascending: false });

      if (commissionsError) throw commissionsError;
      setCommissions(commissionsData || []);

      // Calculate stats
      const activeClients = clientsData?.filter(c => c.status === 'Active') || [];
      const totalMRR = activeClients.reduce((sum, c) => sum + (parseFloat(c.mrr) || 0), 0);
      const totalComm = commissionsData?.reduce((sum, c) => sum + (parseFloat(c.commission_amount) || 0), 0) || 0;
      const pendingComm = commissionsData?.filter(c => c.status === 'Pending').reduce((sum, c) => sum + (parseFloat(c.commission_amount) || 0), 0) || 0;

      setStats({
        totalClients: clientsData?.length || 0,
        activeClients: activeClients.length,
        totalMRR,
        totalCommissions: totalComm,
        pendingCommissions: pendingComm,
        milestone10Reached: activeClients.length >= 10
      });

    } catch (error) {
      console.error('Error fetching reseller data:', error);
      alert('Failed to load dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const tierPricing = {
    Starter: 2000,
    Growth: 3700,
    Enterprise: 5000
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </Layout>
    );
  }

  if (!reseller) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Reseller Access Required</h2>
            <p className="text-white/70 mb-6">Your account is not set up as a reseller partner.</p>
            <p className="text-sm text-white/50">Contact support to activate reseller features.</p>
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
            <h1 className="text-3xl font-bold text-white">Reseller Dashboard</h1>
            <p className="text-sm text-white/60 mt-1">{reseller.reseller_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-xl font-semibold ${
              reseller.status === 'Good Standing' 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              {reseller.status}
            </span>
          </div>
        </div>

        {/* Partner Admin Milestone Card */}
        {!stats.milestone10Reached && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">🎯 Partner Admin Discount</h3>
                <p className="text-sm text-purple-200">50% off until 10 clients milestone</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{stats.activeClients}/10</div>
                <div className="text-xs text-purple-300">Clients</div>
              </div>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${(stats.activeClients / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-purple-200 mt-2">
              💰 Discount expires 6 months from agreement date or at 10 clients
            </p>
          </div>
        )}

        {stats.milestone10Reached && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">🎉 Milestone Reached!</h3>
            <p className="text-green-200">You've reached 10+ active clients. Contact us to negotiate extended discount terms.</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-white">{stats.totalClients}</div>
            <div className="text-sm text-white/70">Total Clients</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400">{stats.activeClients}</div>
            <div className="text-sm text-white/70">Active Clients</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-cyan-400">R{stats.totalMRR.toFixed(0)}</div>
            <div className="text-sm text-white/70">Total MRR</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-3xl font-bold text-purple-400">R{(stats.totalMRR * reseller.commission_rate).toFixed(0)}</div>
            <div className="text-sm text-white/70">Your Commission ({reseller.commission_rate * 100}%)</div>
          </div>
        </div>

        {/* Clients List */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Clients</h2>
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
              + Add Client
            </button>
          </div>

          <div className="space-y-3">
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-white/70">No clients yet. Start adding clients to earn commissions!</p>
              </div>
            ) : (
              clients.map((client) => (
                <div key={client.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{client.client_name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          client.status === 'Active' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {client.status}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                          {client.subscription_tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>💰 MRR: R{client.mrr}</span>
                        <span>📊 Your Cut: R{(client.mrr * reseller.commission_rate).toFixed(0)}</span>
                        <span>📅 Since: {new Date(client.onboarded_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Commission History */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Commission History</h2>
          
          <div className="space-y-2">
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                No commissions yet. Commissions are calculated monthly.
              </div>
            ) : (
              commissions.map((comm) => (
                <div key={comm.id} className="flex items-center justify-between py-3 border-b border-white/10">
                  <div>
                    <div className="font-semibold text-white">
                      {new Date(comm.period_start).toLocaleDateString()} - {new Date(comm.period_end).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-white/60">
                      MRR: R{comm.mrr_amount} × {comm.commission_rate * 100}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">R{comm.commission_amount}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      comm.status === 'Paid' 
                        ? 'bg-green-500/20 text-green-300' 
                        : comm.status === 'Pending' 
                        ? 'bg-orange-500/20 text-orange-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {comm.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResellerDashboard;
