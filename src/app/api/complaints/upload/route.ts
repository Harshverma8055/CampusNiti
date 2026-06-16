import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;   // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;   // 50 MB

// POST /api/complaints/upload — Upload evidence media to Supabase Storage
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        // Students upload evidence; maintenance/admin upload repair photos
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const bucket = formData.get('bucket') as string | null ?? 'complaint-before';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate MIME type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Unsupported file type: ${file.type}. Allowed: jpeg, png, webp, mp4` },
                { status: 400 }
            );
        }

        // Validate size
        const isVideo = file.type.startsWith('video/');
        const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (file.size > maxBytes) {
            return NextResponse.json(
                { error: `File too large. Max ${isVideo ? '50MB for video' : '10MB for image'}` },
                { status: 400 }
            );
        }

        // Only students can upload to 'complaint-before'; maintenance/admin to 'complaint-after'
        if (bucket === 'complaint-after' && session.role === 'STUDENT') {
            return NextResponse.json({ error: 'Students cannot upload to this bucket' }, { status: 403 });
        }

        const supabase = getSupabase();

        // Generate unique storage path
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const uniqueName = `${session.userId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const storagePath = `${session.userId}/${uniqueName}`;

        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        let finalStoragePath = storagePath;
        let finalSignedUrl = null;

        // Try Supabase storage upload (works with service role key OR anon key if bucket policies allow)
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from(bucket)
            .upload(storagePath, fileBuffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (!uploadErr && uploadData) {
            // Generate a signed URL immediately so it can be stored as public_url
            const { data: signedData } = await supabase.storage
                .from(bucket)
                .createSignedUrl(uploadData.path, 604800); // 7-day expiry

            finalStoragePath = uploadData.path;
            finalSignedUrl = signedData?.signedUrl ?? null;
        } else {
            // Supabase upload failed — try local fallback
            console.warn('Supabase storage upload failed, trying local fallback:', uploadErr?.message);
            
            try {
                const fs = await import('fs/promises');
                const path = await import('path');
                
                // Use /tmp on Vercel (read-only fs), public/uploads locally
                const isVercel = !!process.env.VERCEL;
                const baseDir = isVercel ? '/tmp' : path.join(process.cwd(), 'public');
                const uploadDir = path.join(baseDir, 'uploads', bucket, session.userId);
                await fs.mkdir(uploadDir, { recursive: true });
                
                const localFilePath = path.join(uploadDir, uniqueName);
                await fs.writeFile(localFilePath, fileBuffer);
                
                if (isVercel) {
                    // On Vercel, /tmp files aren't publicly accessible
                    // Store as a data URL so the image can still be displayed
                    const base64 = Buffer.from(fileBuffer).toString('base64');
                    finalSignedUrl = `data:${file.type};base64,${base64}`;
                    finalStoragePath = `tmp:${bucket}/${session.userId}/${uniqueName}`;
                } else {
                    finalStoragePath = `local:${bucket}/${session.userId}/${uniqueName}`;
                    finalSignedUrl = `/uploads/${bucket}/${session.userId}/${uniqueName}`;
                }
            } catch (fsErr) {
                console.error('Local fallback also failed:', fsErr);
                return NextResponse.json({ 
                    error: `Upload failed: ${uploadErr?.message || 'Storage unavailable'}. Please ensure the Supabase storage bucket "${bucket}" exists and has proper policies.` 
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            success:     true,
            storagePath: finalStoragePath,
            signedUrl:   finalSignedUrl,
            bucket,
            mediaType:   isVideo ? 'VIDEO' : 'IMAGE',
        }, { status: 201 });
    } catch (err) {
        console.error('Upload error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
    }
}

// GET signed URL helper — called when displaying media
// GET /api/complaints/upload?path=...&bucket=...
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');
        const bucket = searchParams.get('bucket') ?? 'complaint-before';

        if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

        if (path.startsWith('local:')) {
            const localPath = path.replace('local:', '');
            return NextResponse.json({ url: `/uploads/${localPath}` });
        }

        const supabase = getSupabase();
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);  // 1 hour expiry

        if (error || !data?.signedUrl) {
            return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
        }

        return NextResponse.json({ url: data.signedUrl });
    } catch (err) {
        console.error('Signed URL error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
