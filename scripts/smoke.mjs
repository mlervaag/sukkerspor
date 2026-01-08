#!/usr/bin/env node
/**
 * Sukkerspor API Smoke Test
 * 
 * Validates end-to-end API behavior against a running local or deployed instance.
 * Uses built-in fetch (Node 20+), no external dependencies.
 * 
 * Usage:
 *   cmd /c node scripts/smoke.mjs
 *   cmd /c node scripts/smoke.mjs --base=http://localhost:3000
 *   cmd /c node scripts/smoke.mjs --password=yourpass
 *   cmd /c node scripts/smoke.mjs --no-cleanup
 * 
 * Environment variables (alternative to flags):
 *   SMOKE_BASE_URL - Base URL (default: http://localhost:3000)
 *   APP_PASSWORD   - Login password
 */

const TEST_MARKER = `__SMOKE_TEST_${Date.now()}__`;
let sessionCookie = null;
let createdReadingId = null;
let testsPassed = 0;
let testsFailed = 0;

// Parse args
const args = process.argv.slice(2);
const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const BASE = getArg('base') || process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const PASSWORD = getArg('password') || process.env.APP_PASSWORD;
const NO_CLEANUP = hasFlag('no-cleanup');

if (!PASSWORD) {
    console.error('❌ ERROR: Password required. Use --password=... or set APP_PASSWORD env var.');
    process.exit(1);
}

// Utility functions
function log(msg) { console.log(`  ${msg}`); }
function pass(name) { console.log(`✅ PASS: ${name}`); testsPassed++; }
function fail(name, reason) { console.log(`❌ FAIL: ${name} - ${reason}`); testsFailed++; }

async function request(method, path, body = null, expectAuth = true) {
    const url = `${BASE}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (expectAuth && sessionCookie) {
        headers['Cookie'] = sessionCookie;
    }
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    const cacheControl = res.headers.get('Cache-Control');
    const contentType = res.headers.get('Content-Type');

    let data = null;
    if (contentType?.includes('application/json')) {
        data = await res.json();
    } else if (contentType?.includes('application/pdf')) {
        data = await res.arrayBuffer();
    } else {
        data = await res.text();
    }

    // Extract Set-Cookie if present (for login)
    const setCookie = res.headers.get('Set-Cookie');
    if (setCookie) {
        // Extract just the cookie name=value, not the metadata
        sessionCookie = setCookie.split(';')[0];
    }

    return { status: res.status, data, cacheControl, contentType };
}

// Tests
async function testHealthPublic() {
    const { status, data, cacheControl } = await request('GET', '/api/health', null, false);
    if (status !== 200) return fail('Health public', `Expected 200, got ${status}`);
    if (!data.status || data.status !== 'healthy') return fail('Health public', 'Not healthy');
    if (cacheControl !== 'no-store') return fail('Health public', `Cache-Control should be no-store, got ${cacheControl}`);
    pass('Health public, no-store header');
}

async function testUnauthReturns401() {
    const { status, data } = await request('GET', '/api/readings', null, false);
    if (status !== 401) return fail('Unauth 401', `Expected 401, got ${status}`);
    if (data?.error !== 'Unauthorized') return fail('Unauth 401', `Expected {error:"Unauthorized"}, got ${JSON.stringify(data)}`);
    pass('Unauthenticated GET /api/readings returns 401');
}

async function testLogin() {
    const { status, data } = await request('POST', '/api/auth/login', { password: PASSWORD }, false);
    if (status !== 200) return fail('Login', `Expected 200, got ${status}`);
    if (!data.success) return fail('Login', 'Login did not return success');
    if (!sessionCookie) return fail('Login', 'No session cookie received');
    pass('Login successful');
}

async function testCreateReading() {
    const now = new Date();
    const payload = {
        measuredAt: now.toISOString(),
        valueMmolL: '5.5',
        isFasting: true,
        isPostMeal: false,
        mealType: null,
        feelingNotes: TEST_MARKER,
    };
    const { status, data, cacheControl } = await request('POST', '/api/readings', payload);
    if (status !== 201) return fail('Create reading', `Expected 201, got ${status}`);
    if (!data.id) return fail('Create reading', 'No id returned');
    if (cacheControl !== 'no-store') return fail('Create reading', `Cache-Control should be no-store`);
    createdReadingId = data.id;
    pass(`Create reading (id: ${createdReadingId.substring(0, 8)}...)`);
}

async function testListReadingsContainsCreated() {
    const now = new Date();
    const { status, data, cacheControl } = await request('GET', `/api/readings?date=${now.toISOString()}`);
    if (status !== 200) return fail('List readings', `Expected 200, got ${status}`);
    if (!Array.isArray(data)) return fail('List readings', 'Response is not an array');
    if (!cacheControl?.includes('private') || !cacheControl?.includes('no-store')) {
        return fail('List readings', `Cache-Control should be private, no-store, got ${cacheControl}`);
    }
    const found = data.find(r => r.id === createdReadingId);
    if (!found) return fail('List readings', `Created reading ${createdReadingId} not found in week list`);
    pass('List readings contains created reading');
}

async function testUpdateReading() {
    if (!createdReadingId) return fail('Update reading', 'No reading to update');
    const payload = { valueMmolL: '6.0', feelingNotes: `${TEST_MARKER}_updated` };
    const { status, cacheControl } = await request('PUT', `/api/readings/${createdReadingId}`, payload);
    if (status !== 200) return fail('Update reading', `Expected 200, got ${status}`);
    if (cacheControl !== 'no-store') return fail('Update reading', `Cache-Control should be no-store`);
    pass('Update reading');
}

async function testExportBackup() {
    const { status, data, cacheControl, contentType } = await request('GET', '/api/backup/export');
    if (status !== 200) return fail('Export backup', `Expected 200, got ${status}`);
    if (!contentType?.includes('application/json')) return fail('Export backup', 'Not JSON');
    if (!cacheControl?.includes('private') || !cacheControl?.includes('no-store')) {
        return fail('Export backup', `Cache-Control should be private, no-store`);
    }
    if (data.schema_version !== 1) return fail('Export backup', `schema_version should be 1, got ${data.schema_version}`);
    if (!Array.isArray(data.readings)) return fail('Export backup', 'readings should be array');
    pass('Export backup with schema_version 1');
    return data;
}

async function testImportBackup(backupData) {
    // Minimal round-trip: import the same data
    const { status, data, cacheControl } = await request('POST', '/api/backup/import', backupData);
    if (status !== 200) {
        log(`  Import error response: ${JSON.stringify(data)}`);
        return fail('Import backup', `Expected 200, got ${status}`);
    }
    if (!data.success) return fail('Import backup', 'Import did not return success');
    if (cacheControl !== 'no-store') return fail('Import backup', `Cache-Control should be no-store`);
    pass('Import backup round-trip');
}

async function testPDFReport() {
    const { status, cacheControl, contentType, data } = await request('GET', '/api/report/pdf?range=week&lang=no');
    if (status !== 200) return fail('PDF report', `Expected 200, got ${status}`);
    if (!contentType?.includes('application/pdf')) return fail('PDF report', `Content-Type should be application/pdf, got ${contentType}`);
    if (cacheControl !== 'no-store') return fail('PDF report', `Cache-Control should be no-store`);
    if (!(data instanceof ArrayBuffer) || data.byteLength < 100) return fail('PDF report', 'PDF too small or not binary');
    pass('PDF report (week, no)');

    // Also test month
    const { status: s2, contentType: ct2 } = await request('GET', '/api/report/pdf?range=month&lang=en');
    if (s2 !== 200) return fail('PDF report month', `Expected 200, got ${s2}`);
    if (!ct2?.includes('application/pdf')) return fail('PDF report month', 'Not PDF');
    pass('PDF report (month, en)');
}

async function testDeleteReading() {
    if (!createdReadingId) return fail('Delete reading', 'No reading to delete');
    const { status, cacheControl } = await request('DELETE', `/api/readings/${createdReadingId}`);
    if (status !== 200) return fail('Delete reading', `Expected 200, got ${status}`);
    if (cacheControl !== 'no-store') return fail('Delete reading', `Cache-Control should be no-store`);
    pass('Delete reading');
}

async function testDeletedReadingGone() {
    const now = new Date();
    const { status, data } = await request('GET', `/api/readings?date=${now.toISOString()}`);
    if (status !== 200) return fail('Verify deleted', `Expected 200, got ${status}`);
    const found = data.find(r => r.id === createdReadingId);
    if (found) return fail('Verify deleted', 'Deleted reading still appears in list');
    pass('Deleted reading no longer in list');
}

// Main
async function main() {
    console.log(`\n🧪 Sukkerspor Smoke Test\n   Base: ${BASE}\n`);

    try {
        // Public checks
        await testHealthPublic();
        await testUnauthReturns401();

        // Auth
        await testLogin();

        // CRUD
        await testCreateReading();
        await testListReadingsContainsCreated();
        await testUpdateReading();

        // Backup
        const backupData = await testExportBackup();
        if (backupData) await testImportBackup(backupData);

        // PDF
        await testPDFReport();

        // Cleanup
        if (!NO_CLEANUP) {
            // Re-create a reading to delete (import may have changed state)
            const now = new Date();
            const { data } = await request('POST', '/api/readings', {
                measuredAt: now.toISOString(),
                valueMmolL: '5.0',
                isFasting: true,
                isPostMeal: false,
                feelingNotes: TEST_MARKER + '_cleanup',
            });
            if (data?.id) {
                createdReadingId = data.id;
                await testDeleteReading();
                await testDeletedReadingGone();
            }
        } else {
            log('(Skipping cleanup due to --no-cleanup flag)');
        }

    } catch (err) {
        console.error(`\n💥 Unexpected error: ${err.message}`);
        testsFailed++;
    }

    // Summary
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`   PASS: ${testsPassed}   FAIL: ${testsFailed}`);
    console.log(`${'─'.repeat(40)}\n`);

    process.exit(testsFailed > 0 ? 1 : 0);
}

main();
