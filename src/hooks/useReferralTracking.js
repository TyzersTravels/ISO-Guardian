import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useReferralTracking() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    const partner = searchParams.get('partner')

    if (ref) {
      sessionStorage.setItem('isoguardian_ref', ref)
      sessionStorage.setItem('isoguardian_ref_type', 'affiliate')
    }
    if (partner) {
      sessionStorage.setItem('isoguardian_ref', partner)
      sessionStorage.setItem('isoguardian_ref_type', 'partner')
    }
  }, [searchParams])

  return {
    refCode: sessionStorage.getItem('isoguardian_ref'),
    refType: sessionStorage.getItem('isoguardian_ref_type'),
    isPartnerReferral: sessionStorage.getItem('isoguardian_ref_type') === 'partner',
    isAffiliateReferral: sessionStorage.getItem('isoguardian_ref_type') === 'affiliate',
  }
}
