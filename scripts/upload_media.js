const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ASSET_DIR = 'D:/MAIN/project2/assets';
const BUCKET_NAME = 'training-materials';

async function main() {
    try {
        console.log('1. Checking bucket...');
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) throw bucketError;

        const bucketExists = buckets.some(b => b.name === BUCKET_NAME);
        if (!bucketExists) {
            console.log(`Creating bucket ${BUCKET_NAME}...`);
            const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
                public: true,
            });
            if (createError) throw createError;
            console.log('Bucket created successfully!');
        } else {
            console.log(`Bucket ${BUCKET_NAME} already exists.`);
            // ensure it's public
            const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
                public: true,
            });
            if (updateError) console.error('Error updating bucket to public:', updateError);
            else console.log('Bucket is public.');
        }

        console.log('\n2. Uploading files...');
        const filesToUpload = [
            { localPath: path.join(ASSET_DIR, 'audio', 'sample_training.mp3'), type: 'audio', ext: 'mp3' },
            { localPath: path.join(ASSET_DIR, 'pdfs', '12_-_Columns.pdf'), type: 'pdf', ext: 'pdf' },
            { localPath: path.join(ASSET_DIR, 'pdfs', '13_-_Flutter_Outlines_&_Shortcuts.pdf'), type: 'pdf', ext: 'pdf' },
            { localPath: path.join(ASSET_DIR, 'pdfs', '14_-_Expanded_Widgets.pdf'), type: 'pdf', ext: 'pdf' },
            { localPath: path.join(ASSET_DIR, 'pdfs', '2_-_Flutter_OverView.pdf'), type: 'pdf', ext: 'pdf' },
            { localPath: path.join(ASSET_DIR, 'pdfs', '8_-_Image_and_Assets.pdf'), type: 'pdf', ext: 'pdf' }
        ];

        for (const file of filesToUpload) {
            const fileName = path.basename(file.localPath);
            const storagePath = `${file.type}/${fileName}`;
            
            console.log(`Uploading ${fileName} to ${storagePath}...`);
            
            if (!fs.existsSync(file.localPath)) {
                console.error(`File not found: ${file.localPath}`);
                continue;
            }

            const fileBuffer = fs.readFileSync(file.localPath);
            
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileBuffer, {
                    contentType: file.ext === 'pdf' ? 'application/pdf' : 'audio/mpeg',
                    upsert: true
                });

            if (error) {
                console.error(`Failed to upload ${fileName}:`, error);
            } else {
                console.log(`Successfully uploaded ${fileName}`);
            }
        }

        console.log('\n3. Updating database records...');
        const { data: materials, error: fetchError } = await supabase.from('training_materials').select('*');
        if (fetchError) throw fetchError;

        for (const material of materials) {
            const oldUrl = material.media_url;
            if (oldUrl && oldUrl.startsWith('assets/')) {
                // Determine the file name and type based on the old URL
                let fileName = path.basename(oldUrl);
                let folder = oldUrl.includes('pdf') ? 'pdf' : 'audio';

                const storagePath = `${folder}/${fileName}`;
                const publicUrlData = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
                const publicUrl = publicUrlData.data.publicUrl;

                console.log(`Updating DB for ${material.title}: ${oldUrl} -> ${publicUrl}`);

                const { error: updateError } = await supabase
                    .from('training_materials')
                    .update({ media_url: publicUrl })
                    .eq('id', material.id);

                if (updateError) {
                    console.error(`Failed to update DB for ${material.id}:`, updateError);
                } else {
                    console.log(`Successfully updated DB for ${material.id}`);
                }
            }
        }

        console.log('\nDone!');
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
