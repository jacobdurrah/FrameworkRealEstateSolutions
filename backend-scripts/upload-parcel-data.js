#!/usr/bin/env node

/**
 * Upload Detroit Parcel Data to Supabase
 * This script reads the CSV file and uploads it to Supabase in batches
 */

const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const pLimit = require('p-limit');
require('dotenv').config({ path: './.env' });

// Configuration
const BATCH_SIZE = 1000; // Number of records to insert at once
const CONCURRENT_BATCHES = 3; // Number of concurrent batch operations
const CSV_FILE_PATH = '../parcel_file_current_-3720075312525260545.csv';

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Progress tracking
let totalProcessed = 0;
let totalInserted = 0;
let totalErrors = 0;
let startTime = Date.now();

// Parse date safely
function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;
    try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch {
        return null;
    }
}

// Parse number safely
function parseNumber(str) {
    if (!str || str.trim() === '') return null;
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
}

// Parse integer safely
function parseInteger(str) {
    if (!str || str.trim() === '') return null;
    const num = parseInt(str.replace(/[^0-9-]/g, ''));
    return isNaN(num) ? null : num;
}

// Format owner name
function formatOwnerName(name1, name2) {
    const n1 = (name1 || '').trim();
    const n2 = (name2 || '').trim();
    if (n1 && n2) return `${n1}, ${n2}`;
    return n1 || n2 || null;
}

// Format mailing address
function formatMailingAddress(address, city, state, zip) {
    const parts = [];
    if (address) parts.push(address.trim());
    if (city) parts.push(city.trim());
    if (state) parts.push(state.trim());
    if (zip) parts.push(zip.trim());
    return parts.length > 0 ? parts.join(', ') : null;
}

// Transform CSV row to database record
function transformRow(row) {
    return {
        parcel_id: row['Parcel ID'],
        address: row['Address'],
        zip_code: row['ZIP Code'],
        
        // Owner Information
        owner_name1: row['Taxpayer 1'],
        owner_name2: row['Taxpayer 2'],
        owner_full_name: formatOwnerName(row['Taxpayer 1'], row['Taxpayer 2']),
        owner_mailing_address: row['Taxpayer Address'],
        owner_mailing_city: row['Taxpayer City'],
        owner_mailing_state: row['Taxpayer State'],
        owner_mailing_zip: row['Taxpayer ZIP Code'],
        owner_full_mailing_address: formatMailingAddress(
            row['Taxpayer Address'],
            row['Taxpayer City'],
            row['Taxpayer State'],
            row['Taxpayer ZIP Code']
        ),
        
        // Property Details
        property_class: row['Property Class'],
        property_class_description: row['Property Class Description'],
        year_built: parseInteger(row['Year Built']),
        building_style: row['Building Style'],
        building_count: parseInteger(row['Building Count']),
        total_floor_area: parseInteger(row['Total Floor Area']),
        
        // Tax Information
        tax_status: row['Tax Status'],
        tax_status_description: row['Tax Status Description'],
        assessed_value: parseNumber(row['Assessed Value']),
        previous_assessed_value: parseNumber(row['Previous Assessed Value']),
        taxable_value: parseNumber(row['Taxable Value']),
        previous_taxable_value: parseNumber(row['Previous Taxable Value']),
        
        // Location Information
        neighborhood: row['Neighborhood'],
        ward: parseInteger(row['Ward']),
        council_district: parseInteger(row['Council District']),
        
        // Lot Information
        total_square_footage: parseInteger(row['Total Square Footage']),
        total_acreage: parseNumber(row['Total Acreage']),
        frontage: parseNumber(row['Frontage']),
        depth: parseNumber(row['Depth']),
        
        // Sale Information
        sale_date: parseDate(row['Sale Date']),
        sale_price: parseNumber(row['Sale Price']),
        
        // Additional Fields
        legal_description: row['Legal Description'],
        street_number: row['Street Number'],
        street_prefix: row['Street Prefix'],
        street_name: row['Street Name']
    };
}

// Insert batch of records
async function insertBatch(records) {
    try {
        const { data, error } = await supabase
            .from('parcels')
            .insert(records)
            .select('id');
        
        if (error) {
            console.error(`Batch insert error:`, error.message);
            totalErrors += records.length;
        } else {
            totalInserted += records.length;
        }
    } catch (err) {
        console.error(`Batch insert exception:`, err.message);
        totalErrors += records.length;
    }
}

// Main upload function
async function uploadParcelData() {
    console.log('Starting parcel data upload...');
    console.log(`Reading from: ${CSV_FILE_PATH}`);
    
    // Check if file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error('CSV file not found!');
        process.exit(1);
    }
    
    // Create batching system
    const limit = pLimit(CONCURRENT_BATCHES);
    let currentBatch = [];
    const promises = [];
    
    // Create read stream
    const stream = fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv());
    
    // Process each row
    stream.on('data', (row) => {
        totalProcessed++;
        
        // Transform row
        const record = transformRow(row);
        currentBatch.push(record);
        
        // When batch is full, schedule insert
        if (currentBatch.length >= BATCH_SIZE) {
            const batchToInsert = [...currentBatch];
            promises.push(limit(() => insertBatch(batchToInsert)));
            currentBatch = [];
            
            // Progress update
            if (totalProcessed % 10000 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = Math.round(totalProcessed / elapsed);
                console.log(`Processed: ${totalProcessed.toLocaleString()} | Inserted: ${totalInserted.toLocaleString()} | Errors: ${totalErrors} | Rate: ${rate}/sec`);
            }
        }
    });
    
    // Handle stream end
    stream.on('end', async () => {
        console.log('CSV reading complete. Finishing uploads...');
        
        // Insert remaining records
        if (currentBatch.length > 0) {
            promises.push(limit(() => insertBatch(currentBatch)));
        }
        
        // Wait for all batches to complete
        await Promise.all(promises);
        
        // Final stats
        const elapsed = (Date.now() - startTime) / 1000;
        console.log('\n=== Upload Complete ===');
        console.log(`Total Processed: ${totalProcessed.toLocaleString()}`);
        console.log(`Total Inserted: ${totalInserted.toLocaleString()}`);
        console.log(`Total Errors: ${totalErrors.toLocaleString()}`);
        console.log(`Time Elapsed: ${elapsed.toFixed(2)} seconds`);
        console.log(`Average Rate: ${Math.round(totalProcessed / elapsed)}/sec`);
        
        process.exit(totalErrors > 0 ? 1 : 0);
    });
    
    // Handle errors
    stream.on('error', (error) => {
        console.error('Stream error:', error);
        process.exit(1);
    });
}

// Check environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Missing required environment variables!');
    console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    console.error('Copy .env.example to .env and fill in your Supabase credentials');
    process.exit(1);
}

// Run the upload
uploadParcelData();