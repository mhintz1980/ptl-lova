import dotenv from 'dotenv'
import { getPumpsInternal } from '../api/chat.js'
import { getCustomerInfoInternal } from '../api/tools/customer.js'
import { getKPIReportInternal } from '../api/tools/kpi.js'
import { STAGES } from '../api/tools/schemas.js'

// Load env vars
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🧪 Starting AI Tools Verification...')
  console.log('-----------------------------------')

  // 1. Test getPumps with new schema (no includePaused)
  console.log('\n📝 Testing getPumps...')
  const pumpsRes = await getPumpsInternal({
    limit: 5,
    stage: 'FABRICATION',
  })

  if (pumpsRes.error) {
    console.error('❌ getPumps failed:', pumpsRes.error)
  } else {
    console.log(
      `✅ getPumps success! Found ${pumpsRes.pumps.length} pumps in FABRICATION.`
    )
    if (pumpsRes.pumps.length > 0) {
      console.log('   Sample:', {
        id: pumpsRes.pumps[0].id,
        customer: pumpsRes.pumps[0].customer,
      })
    }
  }

  // 2. Test getCustomerInfo (Aggregation)
  // We'll pick a customer name from the previous result if available, or 'Net' as a common partial
  const customerName = pumpsRes.pumps[0]?.customer?.split(' ')[0] || 'Net'
  console.log(`\n📝 Testing getCustomerInfo for "${customerName}"...`)

  const customerRes = await getCustomerInfoInternal({
    customerName,
    includeRecentOrders: true,
  })

  if (customerRes.error) {
    console.error('❌ getCustomerInfo failed:', customerRes.error)
  } else {
    console.log('✅ getCustomerInfo success!')
    console.log('   Stats:', {
      name: customerRes.customerInfo?.customerName,
      active: customerRes.customerInfo?.totalActiveOrders,
      completed: customerRes.customerInfo?.totalCompletedOrders,
      value: customerRes.customerInfo?.totalValue,
    })
    console.log(
      '   Recent Orders:',
      customerRes.customerInfo?.recentOrders?.length || 0
    )
  }

  // 3. Test getKPIReport (Aggregation)
  console.log('\n📝 Testing getKPIReport (Throughput)...')
  const kpiRes = await getKPIReportInternal({
    metric: 'throughput',
  })

  if (kpiRes.error) {
    console.error('❌ getKPIReport failed:', kpiRes.error)
  } else {
    console.log('✅ getKPIReport success!')
    console.log('   Report:', {
      metric: kpiRes.report?.metric,
      value: kpiRes.report?.value,
      unit: kpiRes.report?.unit,
      insight: kpiRes.report?.insight,
    })
  }

  console.log('\n-----------------------------------')
  console.log('🏁 Verification Complete')
}

main().catch(console.error)
