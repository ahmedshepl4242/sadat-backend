const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TENANT_ID = 'test_tenant_123';

const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID
    }
};

let adminToken = '';
let captain1Token = '';
let captain2Token = '';
let captain1Id = '';
let captain2Id = '';
let requestIds = [];

async function makeRequest(method, url, data = null, token = null) {
    try {
        const config = { ...axiosConfig };
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios({ method, url, data, ...config });
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
}

async function testAllCaptainRequestEndpoints(step) {
    console.log(`\n=== Testing All Endpoints After Step: ${step} ===`);

    // 1. Captain 1 - Get own requests
    console.log('\n1. Captain 1 - Get own requests:');
    const cap1Requests = await makeRequest('GET', `${BASE_URL}/captain-requests`, null, captain1Token);
    console.log(JSON.stringify(cap1Requests, null, 2));

    // 2. Captain 2 - Get own requests
    console.log('\n2. Captain 2 - Get own requests:');
    const cap2Requests = await makeRequest('GET', `${BASE_URL}/captain-requests`, null, captain2Token);
    console.log(JSON.stringify(cap2Requests, null, 2));

    // 3. Admin - Get all requests
    console.log('\n3. Admin - Get all requests:');
    const adminAllRequests = await makeRequest('GET', `${BASE_URL}/admin/captain-requests/all`, null, adminToken);
    console.log(JSON.stringify(adminAllRequests, null, 2));

    // 4. Test get request by ID for each existing request
    if (requestIds.length > 0) {
        for (let i = 0; i < requestIds.length; i++) {
            const requestId = requestIds[i];
            const captain = i < 2 ? 'Captain 1' : 'Captain 2';
            const token = i < 2 ? captain1Token : captain2Token;

            console.log(`\n4.${i + 1}. ${captain} - Get request by ID (${requestId}):`);
            const requestById = await makeRequest('GET', `${BASE_URL}/captain-requests/${requestId}`, null, token);
            console.log(JSON.stringify(requestById, null, 2));
        }
    }
}

async function runCaptainRequestsTest() {
    console.log('🚀 Starting Captain Requests Flow Test...\n');

    try {
        // Step 1: Admin Signup
        console.log('📝 Step 1: Admin Signup');
        const adminSignup = await makeRequest('POST', `${BASE_URL}/admin/signup`, {
            userName: 'admin_user',
            email: 'admin@test.com',
            phoneNumber: '+1234567890',
            password: 'Admin123!',
            address: 'Admin Address 123',
            neighborhoodId: 1
        });

        if (!adminSignup.success) {
            console.error('❌ Admin signup failed:', adminSignup.error);
            return;
        }

        adminToken = adminSignup.data.data.token;
        console.log('✅ Admin signed up successfully');

        // Step 2: Captain 1 Signup
        console.log('\n📝 Step 2: Captain 1 Signup');
        const captain1Signup = await makeRequest('POST', `${BASE_URL}/captains/signup`, {
            userName: 'captain_one',
            email: 'captain1@test.com',
            phoneNumber: '+1234567891',
            password: 'Captain123!',
            longitude: 31.2357,
            latitude: 30.0444,
            workingHoursStart: '09:00',
            workingHoursEnd: '17:00'
        });

        if (!captain1Signup.success) {
            console.error('❌ Captain 1 signup failed:', captain1Signup.error);
            return;
        }

        captain1Token = captain1Signup.data.data.token;
        captain1Id = captain1Signup.data.data.captain.id;
        console.log('✅ Captain 1 signed up successfully');

        // Step 3: Captain 2 Signup
        console.log('\n📝 Step 3: Captain 2 Signup');
        const captain2Signup = await makeRequest('POST', `${BASE_URL}/captains/signup`, {
            userName: 'captain_two',
            email: 'captain2@test.com',
            phoneNumber: '+1234567892',
            password: 'Captain123!',
            longitude: 31.2400,
            latitude: 30.0500,
            workingHoursStart: '10:00',
            workingHoursEnd: '18:00'
        });

        if (!captain2Signup.success) {
            console.error('❌ Captain 2 signup failed:', captain2Signup.error);
            return;
        }

        captain2Token = captain2Signup.data.data.token;
        captain2Id = captain2Signup.data.data.captain.id;
        console.log('✅ Captain 2 signed up successfully');

        // Step 4: Admin unlocks both captains
        console.log('\n🔓 Step 4: Admin unlocks both captains');
        const unlockCaptain1 = await makeRequest('PUT', `${BASE_URL}/admin/captains/${captain1Id}/lock-status`, {
            isLocked: false
        }, adminToken);

        if (!unlockCaptain1.success) {
            console.error('❌ Admin unlock captain 1 failed:', unlockCaptain1.error);
            return;
        }

        console.log('✅ Captain 1 unlocked successfully');

        const unlockCaptain2 = await makeRequest('PUT', `${BASE_URL}/admin/captains/${captain2Id}/lock-status`, {
            isLocked: false
        }, adminToken);

        if (!unlockCaptain2.success) {
            console.error('❌ Admin unlock captain 2 failed:', unlockCaptain2.error);
            return;
        }

        console.log('✅ Captain 2 unlocked successfully');

        // Test all endpoints after initial setup
        await testAllCaptainRequestEndpoints('Initial Setup (no requests yet)');

        // Step 5: Captain 1 submits first request
        console.log('\n📝 Step 5: Captain 1 submits first request');
        const cap1Request1 = await makeRequest('POST', `${BASE_URL}/captain-requests`, {
            description: 'Request from Captain 1 - First request about working hours adjustment'
        }, captain1Token);

        if (!cap1Request1.success) {
            console.error('❌ Captain 1 first request failed:', cap1Request1.error);
            return;
        }

        requestIds.push(cap1Request1.data.data.id);
        console.log('✅ Captain 1 first request submitted');

        await testAllCaptainRequestEndpoints('Captain 1 submitted first request');

        // Step 6: Captain 1 submits second request
        console.log('\n📝 Step 6: Captain 1 submits second request');
        const cap1Request2 = await makeRequest('POST', `${BASE_URL}/captain-requests`, {
            description: 'Request from Captain 1 - Second request about delivery zone expansion'
        }, captain1Token);

        if (!cap1Request2.success) {
            console.error('❌ Captain 1 second request failed:', cap1Request2.error);
            return;
        }

        requestIds.push(cap1Request2.data.data.id);
        console.log('✅ Captain 1 second request submitted');

        await testAllCaptainRequestEndpoints('Captain 1 submitted second request');

        // Step 7: Captain 2 submits first request
        console.log('\n📝 Step 7: Captain 2 submits first request');
        const cap2Request1 = await makeRequest('POST', `${BASE_URL}/captain-requests`, {
            description: 'Request from Captain 2 - First request about vehicle maintenance support'
        }, captain2Token);

        if (!cap2Request1.success) {
            console.error('❌ Captain 2 first request failed:', cap2Request1.error);
            return;
        }

        requestIds.push(cap2Request1.data.data.id);
        console.log('✅ Captain 2 first request submitted');

        await testAllCaptainRequestEndpoints('Captain 2 submitted first request');

        // Step 8: Captain 2 submits second request
        console.log('\n📝 Step 8: Captain 2 submits second request');
        const cap2Request2 = await makeRequest('POST', `${BASE_URL}/captain-requests`, {
            description: 'Request from Captain 2 - Second request about bonus payment clarification'
        }, captain2Token);

        if (!cap2Request2.success) {
            console.error('❌ Captain 2 second request failed:', cap2Request2.error);
            return;
        }

        requestIds.push(cap2Request2.data.data.id);
        console.log('✅ Captain 2 second request submitted');

        await testAllCaptainRequestEndpoints('All requests submitted (4 pending)');

        // Step 9: Admin approves Captain 1's first request
        console.log('\n📝 Step 9: Admin approves Captain 1\'s first request');
        const approveRequest1 = await makeRequest('PUT', `${BASE_URL}/admin/captain-requests/${requestIds[0]}/reply`, {
            status: 'APPROVED',
            reply: 'Your working hours adjustment request has been approved. You can now work flexible hours as requested.'
        }, adminToken);

        if (!approveRequest1.success) {
            console.error('❌ Admin approve request 1 failed:', approveRequest1.error);
            return;
        }

        console.log('✅ Admin approved Captain 1\'s first request');

        await testAllCaptainRequestEndpoints('Admin approved Captain 1 first request');

        // Step 10: Admin rejects Captain 1's second request
        console.log('\n📝 Step 10: Admin rejects Captain 1\'s second request');
        const rejectRequest2 = await makeRequest('PUT', `${BASE_URL}/admin/captain-requests/${requestIds[1]}/reply`, {
            status: 'REJECTED',
            reply: 'Unfortunately, we cannot expand the delivery zone at this time due to operational constraints.'
        }, adminToken);

        if (!rejectRequest2.success) {
            console.error('❌ Admin reject request 2 failed:', rejectRequest2.error);
            return;
        }

        console.log('✅ Admin rejected Captain 1\'s second request');

        await testAllCaptainRequestEndpoints('Admin rejected Captain 1 second request');

        // Step 11: Admin approves Captain 2's first request
        console.log('\n📝 Step 11: Admin approves Captain 2\'s first request');
        const approveRequest3 = await makeRequest('PUT', `${BASE_URL}/admin/captain-requests/${requestIds[2]}/reply`, {
            status: 'APPROVED',
            reply: 'Your vehicle maintenance support request is approved. Please contact HR for maintenance reimbursement procedures.'
        }, adminToken);

        if (!approveRequest3.success) {
            console.error('❌ Admin approve request 3 failed:', approveRequest3.error);
            return;
        }

        console.log('✅ Admin approved Captain 2\'s first request');

        await testAllCaptainRequestEndpoints('Admin approved Captain 2 first request');

        // Step 12: Admin rejects Captain 2's second request
        console.log('\n📝 Step 12: Admin rejects Captain 2\'s second request');
        const rejectRequest4 = await makeRequest('PUT', `${BASE_URL}/admin/captain-requests/${requestIds[3]}/reply`, {
            status: 'REJECTED',
            reply: 'The bonus payment structure is clearly outlined in your contract. No changes can be made at this time.'
        }, adminToken);

        if (!rejectRequest4.success) {
            console.error('❌ Admin reject request 4 failed:', rejectRequest4.error);
            return;
        }

        console.log('✅ Admin rejected Captain 2\'s second request');

        await testAllCaptainRequestEndpoints('All admin replies completed');

        // Step 13: Test delete functionality - Captain 1 tries to delete an approved request (should fail)
        console.log('\n📝 Step 13: Captain 1 tries to delete approved request (should fail)');
        const deleteApproved = await makeRequest('DELETE', `${BASE_URL}/captain-requests/${requestIds[0]}`, null, captain1Token);
        console.log('Delete approved request result:', JSON.stringify(deleteApproved, null, 2));

        // Step 14: Captain 1 creates a new request to test delete functionality
        console.log('\n📝 Step 14: Captain 1 creates new request for delete test');
        const newRequest = await makeRequest('POST', `${BASE_URL}/captain-requests`, {
            description: 'This request will be deleted - test delete functionality'
        }, captain1Token);

        if (newRequest.success) {
            const newRequestId = newRequest.data.data.id;
            console.log('✅ New request created for delete test');

            await testAllCaptainRequestEndpoints('New request created for delete test');

            // Step 15: Captain 1 deletes the new request
            console.log('\n📝 Step 15: Captain 1 deletes the new request');
            const deleteNew = await makeRequest('DELETE', `${BASE_URL}/captain-requests/${newRequestId}`, null, captain1Token);
            console.log('Delete new request result:', JSON.stringify(deleteNew, null, 2));

            if (deleteNew.success) {
                console.log('✅ New request deleted successfully');
            }
        }

        // Final state check
        await testAllCaptainRequestEndpoints('Final state - after delete test');

        // Step 16: Test filtering by status
        console.log('\n📝 Step 16: Test status filtering');

        // Admin gets only PENDING requests
        console.log('\nAdmin - Get PENDING requests:');
        const pendingRequests = await makeRequest('GET', `${BASE_URL}/admin/captain-requests/all?status=PENDING`, null, adminToken);
        console.log(JSON.stringify(pendingRequests, null, 2));

        // Admin gets only APPROVED requests
        console.log('\nAdmin - Get APPROVED requests:');
        const approvedRequests = await makeRequest('GET', `${BASE_URL}/admin/captain-requests/all?status=APPROVED`, null, adminToken);
        console.log(JSON.stringify(approvedRequests, null, 2));

        // Admin gets only REJECTED requests
        console.log('\nAdmin - Get REJECTED requests:');
        const rejectedRequests = await makeRequest('GET', `${BASE_URL}/admin/captain-requests/all?status=REJECTED`, null, adminToken);
        console.log(JSON.stringify(rejectedRequests, null, 2));

        // Captain 1 gets only APPROVED requests
        console.log('\nCaptain 1 - Get APPROVED requests:');
        const cap1Approved = await makeRequest('GET', `${BASE_URL}/captain-requests?status=APPROVED`, null, captain1Token);
        console.log(JSON.stringify(cap1Approved, null, 2));

        // Step 17: Get each captain's requests
        console.log('\n📝 Step 17: Get each captain his requests');
        
        // Captain 1 gets all his requests
        console.log('\nCaptain 1 - Get all his requests:');
        const cap1AllRequests = await makeRequest('GET', `${BASE_URL}/captain-requests`, null, captain1Token);
        console.log(JSON.stringify(cap1AllRequests, null, 2));

        // Captain 2 gets all his requests
        console.log('\nCaptain 2 - Get all his requests:');
        const cap2AllRequests = await makeRequest('GET', `${BASE_URL}/captain-requests`, null, captain2Token);
        console.log(JSON.stringify(cap2AllRequests, null, 2));

        console.log('\n🎉 Captain Requests Flow Test Completed Successfully!');

        console.log('\n📊 Summary:');
        console.log('- 1 Admin signed up');
        console.log('- 2 Captains signed up');
        console.log('- 2 Captains unlocked by admin');
        console.log('- 4 Captain requests submitted (2 from each captain)');
        console.log('- 2 Requests approved (1 from each captain)');
        console.log('- 2 Requests rejected (1 from each captain)');
        console.log('- Delete functionality tested');
        console.log('- Status filtering tested');
        console.log('- All captains can retrieve their own requests');
        console.log('- All 6 endpoints tested after each state change');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    runCaptainRequestsTest();
}

module.exports = { runCaptainRequestsTest };