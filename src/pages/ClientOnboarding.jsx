import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ClientOnboarding = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    industry: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    tier: 'starter',
    standards: {
      ISO_9001: true,
      ISO_14001: false,
      ISO_45001: false
    }
  });

  const tiers = [
    { value: 'starter', label: 'Starter (1-10 users)', price: 2000 },
    { value: 'growth', label: 'Growth (11-20 users)', price: 3700 },
    { value: 'enterprise', label: 'Enterprise (21+ users)', price: 'Custom' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        standards: {
          ...prev.standards,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: formData.company_name,
          registration_number: formData.registration_number,
          industry: formData.industry,
          standards: formData.standards,
          tier: formData.tier,
          status: 'active',
          reseller_id: userProfile.company_id, // ✅ Link to reseller
          created_by: user.id
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Create subscription record
      const tierPrices = { starter: 2000, growth: 3700, enterprise: 0 };
      const price = tierPrices[formData.tier];

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert([{
          company_id: companyData.id,
          tier: formData.tier,
          base_price: price,
          discount_percent: 0,
          final_price: price,
          user_count: formData.tier === 'starter' ? 10 : formData.tier === 'growth' ? 20 : 50,
          status: 'active',
          billing_cycle: 'monthly',
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_by: user.id
        }]);

      if (subError) throw subError;

      // 3. Create admin user for the client
      const tempPassword = `Client${Math.random().toString(36).substring(2, 10)}!`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.contact_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: formData.contact_name,
          company_id: companyData.id
        }
      });

      if (authError) throw authError;

      // 4. Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: formData.contact_email,
          full_name: formData.contact_name,
          role: 'admin',
          company_id: companyData.id,
          is_active: true
        }]);

      if (userError) throw userError;

      alert(`✅ Client onboarded successfully!\n\nLogin credentials:\nEmail: ${formData.contact_email}\nPassword: ${tempPassword}\n\n⚠️ IMPORTANT: Save these credentials and share them securely with the client.`);

      // Reset form
      setFormData({
        company_name: '',
        registration_number: '',
        industry: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        tier: 'starter',
        standards: {
          ISO_9001: true,
          ISO_14001: false,
          ISO_45001: false
        }
      });

    } catch (error) {
      console.error('Error onboarding client:', error);
      alert('Failed to onboard client: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedStandards = Object.entries(formData.standards)
    .filter(([_, selected]) => selected)
    .map(([standard, _]) => standard);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Client Onboarding</h1>
        <p className="text-white/70">Add a new client to your reseller account</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 space-y-6">
        
        {/* Company Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/20 pb-2">Company Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., Acme Construction (Pty) Ltd"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Registration Number</label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="2020/123456/07"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Industry</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="" className="bg-slate-800">Select Industry</option>
                <option value="Manufacturing" className="bg-slate-800">Manufacturing</option>
                <option value="Construction" className="bg-slate-800">Construction</option>
                <option value="Healthcare" className="bg-slate-800">Healthcare</option>
                <option value="IT Services" className="bg-slate-800">IT Services</option>
                <option value="Professional Services" className="bg-slate-800">Professional Services</option>
                <option value="Retail" className="bg-slate-800">Retail</option>
                <option value="Other" className="bg-slate-800">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/20 pb-2">Primary Contact</h2>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Full Name *</label>
            <input
              type="text"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="John Smith"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Email Address *</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="john@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Phone Number</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="071 234 5678"
              />
            </div>
          </div>
        </div>

        {/* Subscription Tier */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/20 pb-2">Subscription Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <label
                key={tier.value}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.tier === tier.value
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={tier.value}
                  checked={formData.tier === tier.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-white font-semibold mb-2">{tier.label.split('(')[0]}</div>
                  <div className="text-xs text-white/60 mb-2">{tier.label.match(/\(([^)]+)\)/)?.[1]}</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {typeof tier.price === 'number' ? `R${tier.price.toLocaleString()}` : tier.price}
                  </div>
                  <div className="text-xs text-white/60">/month</div>
                </div>
              </label>
            ))}
          </div>

          {formData.tier !== 'enterprise' && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
              <div className="text-sm text-cyan-300">
                <strong>Your Commission:</strong> R{(tiers.find(t => t.value === formData.tier)?.price * 0.25).toLocaleString()}/month (25%)
              </div>
            </div>
          )}
        </div>

        {/* ISO Standards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-white/20 pb-2">ISO Standards</h2>
          
          <div className="space-y-3">
            {Object.keys(formData.standards).map((standard) => (
              <label key={standard} className="flex items-center gap-3 p-4 bg-white/5 border border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  name={standard}
                  checked={formData.standards[standard]}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">{standard.replace('_', ' ')}:2015</div>
                  <div className="text-xs text-white/60">
                    {standard === 'ISO_9001' && 'Quality Management System'}
                    {standard === 'ISO_14001' && 'Environmental Management System'}
                    {standard === 'ISO_45001' && 'Occupational Health & Safety'}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selectedStandards.length === 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <p className="text-sm text-orange-300">⚠️ Please select at least one ISO standard</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white/5 border border-white/20 rounded-xl p-6 space-y-3">
          <h3 className="font-bold text-white mb-4">Onboarding Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/60">Company:</span>
              <span className="text-white ml-2">{formData.company_name || '-'}</span>
            </div>
            <div>
              <span className="text-white/60">Contact:</span>
              <span className="text-white ml-2">{formData.contact_name || '-'}</span>
            </div>
            <div>
              <span className="text-white/60">Email:</span>
              <span className="text-white ml-2">{formData.contact_email || '-'}</span>
            </div>
            <div>
              <span className="text-white/60">Tier:</span>
              <span className="text-white ml-2 capitalize">{formData.tier}</span>
            </div>
            <div className="col-span-2">
              <span className="text-white/60">Standards:</span>
              <span className="text-white ml-2">{selectedStandards.join(', ') || 'None selected'}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || selectedStandards.length === 0 || !formData.company_name || !formData.contact_name || !formData.contact_email}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Client Account...' : '🚀 Onboard Client'}
        </button>
      </form>
    </div>
  );
};

export default ClientOnboarding;
