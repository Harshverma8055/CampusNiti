import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const searchType = searchParams.get('type') || 'all';
        const browse = searchParams.get('browse') === 'true';
        const department = searchParams.get('dept') || searchParams.get('department') || '';
        const year = searchParams.get('year') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const countOnly = searchParams.get('countOnly') === 'true';
        // Increase limit to 1000 so that all students in a branch are loaded at once since the UI does not have pagination
        const limit = 1000;
        const offset = (page - 1) * limit;

        const supabase = getSupabase();

        // ──── META MODE ────
        if (searchParams.get('meta') === 'true') {
            const nitjBranches = [
                'Biotechnology', 'Chemical Engineering', 'Civil Engineering',
                'Computer Science and Engineering', 'Data Science and Engineering',
                'Electrical Engineering', 'Electronics and Communication Engineering',
                'Industrial and Production Engineering', 'Information Technology',
                'Instrumentation and Control Engineering', 'Mathematics and Computing',
                'Mechanical Engineering', 'Textile Technology'
            ];
            return NextResponse.json({ departments: nitjBranches, years: [1, 2, 3, 4] });
        }

        // ──── BROWSE MODE (Triggered if browse=true OR if no query is provided) ────
        if (browse || query.length < 2) {
            // Fast count-only mode for branch badges
            if (countOnly) {
                let cq = supabase
                    .from('students')
                    .select('id', { count: 'exact', head: true });
                if (department) cq = cq.eq('department', department);
                if (year) cq = cq.eq('year', parseInt(year));
                const { count: total, error } = await cq;
                if (error) {
                    return NextResponse.json({ error: 'Failed to count' }, { status: 500 });
                }
                return NextResponse.json({ total: total || 0 });
            }

            let q = supabase
                .from('students')
                .select(`
                    id, roll_number, department, year, rating,
                    users(name, avatar_url)
                `, { count: 'exact' })
                .order('department', { ascending: true })
                .order('year', { ascending: true })
                .range(offset, offset + limit - 1);

            if (department) q = q.eq('department', department);
            if (year) q = q.eq('year', parseInt(year));

            const { data, error, count } = await q;

            if (error) {
                console.error('Browse error:', error);
                return NextResponse.json({ error: 'Failed to browse students' }, { status: 500 });
            }

            // Get achievement counts
            const studentIds = (data || []).map((s: Record<string, unknown>) => s.id as string);
            const achievementCounts: Record<string, number> = {};
            if (studentIds.length > 0) {
                const { data: achData } = await supabase
                    .from('achievements')
                    .select('student_id')
                    .in('student_id', studentIds);
                (achData || []).forEach((a: Record<string, unknown>) => {
                    achievementCounts[a.student_id as string] = (achievementCounts[a.student_id as string] || 0) + 1;
                });
            }

            return NextResponse.json({
                students: (data || []).map((s: Record<string, unknown>) => ({
                    id: s.id,
                    name: (s.users as Record<string, unknown>)?.name || 'Unknown',
                    avatarUrl: (s.users as Record<string, unknown>)?.avatar_url,
                    rollNumber: s.roll_number,
                    department: s.department,
                    year: s.year,
                    rating: s.rating,
                    achievementCount: achievementCounts[s.id as string] || 0,
                })),
                total: count || 0,
                page,
            });
        }

        // ──── SEARCH MODE ────
        if (query.length < 2) {
            return NextResponse.json({ students: [] });
        }

        const promises = [];

        if (searchType === 'all' || searchType === 'roll') {
            promises.push(
                supabase
                    .from('students')
                    .select('id, roll_number, department, year, rating, users(name, avatar_url)')
                    .ilike('roll_number', `%${query}%`)
                    .limit(10)
            );
        } else {
            promises.push(Promise.resolve({ data: [], error: null }));
        }

        if (searchType === 'all' || searchType === 'name') {
            promises.push(
                supabase
                    .from('students')
                    .select('id, roll_number, department, year, rating, users!inner(name, avatar_url)')
                    .ilike('users.name', `%${query}%`)
                    .limit(10)
            );
        } else {
            promises.push(Promise.resolve({ data: [], error: null }));
        }

        const [rollSearch, nameSearch] = await Promise.all(promises);

        if (rollSearch.error || nameSearch.error) {
            return NextResponse.json({ error: 'Failed to search students' }, { status: 500 });
        }

        const combined = [...(rollSearch.data || []), ...(nameSearch.data || [])];
        const uniqueIds = new Set();
        const finalResults = [];

        for (const s of combined) {
            if (!uniqueIds.has(s.id)) {
                uniqueIds.add(s.id);
                finalResults.push(s);
            }
        }

        // Get achievement counts for search results
        const searchIds = finalResults.map(s => s.id);
        const searchAchCounts: Record<string, number> = {};
        if (searchIds.length > 0) {
            const { data: achData } = await supabase
                .from('achievements')
                .select('student_id')
                .in('student_id', searchIds);
            (achData || []).forEach((a: Record<string, unknown>) => {
                searchAchCounts[a.student_id as string] = (searchAchCounts[a.student_id as string] || 0) + 1;
            });
        }

        return NextResponse.json({
            students: finalResults.map((s) => ({
                id: s.id,
                name: (Array.isArray(s.users)
                    ? ((s.users as unknown as Record<string,unknown>[])[0]?.name)
                    : (s.users as unknown as Record<string,unknown>)?.name) as string || 'Unknown',
                avatarUrl: (Array.isArray(s.users)
                    ? ((s.users as unknown as Record<string,unknown>[])[0]?.avatar_url)
                    : (s.users as unknown as Record<string,unknown>)?.avatar_url) as string | null,
                rollNumber: s.roll_number,
                department: s.department,
                year: s.year,
                rating: s.rating,
                achievementCount: searchAchCounts[s.id] || 0,
            }))
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
