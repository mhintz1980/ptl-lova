import dotenv from 'dotenv'
import path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import {
  getPumpsInternal,
  getJobStatusInternal,
  getShopCapacityInternal,
} from '../api/chat'

async function verifyTools() {
  console.log('🔍 Starting Chat Tool Verification...')
  console.log('-----------------------------------')

  // Test 1: getPumps
  console.log('\nTesting getPumps...')
  try {
    const pumpsResult = await getPumpsInternal({ limit: 5 })
    if (pumpsResult.error) {
      console.error('❌ getPumps failed:', pumpsResult.error)
    } else {
      console.log(
        `✅ getPumps success! Found ${pumpsResult.pumps.length} pumps.`
      )
      if (pumpsResult.pumps.length > 0) {
        const p = pumpsResult.pumps[0]
        console.log('   Sample:', {
          id: p.id,
          stage: p.stage,
          customer: p.customer,
        })
      }
    }
  } catch (e) {
    console.error('❌ getPumps threw exception:', e)
  }

  // Test 2: getShopCapacity
  console.log('\nTesting getShopCapacity...')
  try {
    const capResult = await getShopCapacityInternal({})
    if (capResult.error) {
      console.error('❌ getShopCapacity failed:', capResult.error)
    } else {
      console.log('✅ getShopCapacity success!')
      console.log('   Summary:', capResult.summary)
    }
  } catch (e) {
    console.error('❌ getShopCapacity threw exception:', e)
  }

  // Test 3: getJobStatus (using a known PO/Serial if available from previous step, or dummy)
  console.log('\nTesting getJobStatus...')
  try {
    // Try to find a real pump to query
    const pumpsResult = await getPumpsInternal({ limit: 1 })
    let jobInput = { po: 'PO-TEST-123' } // Default fallback

    if (!pumpsResult.error && pumpsResult.pumps.length > 0) {
      jobInput = { po: pumpsResult.pumps[0].po }
      console.log(`   Using real PO from DB: ${jobInput.po}`)
    }

    const jobResult = await getJobStatusInternal(jobInput)
    if (jobResult.error) {
      console.error('❌ getJobStatus failed:', jobResult.error)
    } else {
      console.log(
        `✅ getJobStatus success! Found ${jobResult.jobs.length} jobs.`
      )
      if (jobResult.jobs.length > 0) {
        console.log('   Job:', jobResult.jobs[0])
      } else {
        console.log('   (No jobs found for this PO, but query succeeded)')
      }
    }
  } catch (e) {
    console.error('❌ getJobStatus threw exception:', e)
  }

  console.log('\n-----------------------------------')
  console.log('🏁 Verification Complete')
}

verifyTools().catch(console.error)
