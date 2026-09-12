// app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:8000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || 'Mathura, Uttar Pradesh';

    const targetUrl = `${BACKEND_URL}/api/v1/categories/${encodeURIComponent(id)}?location=${encodeURIComponent(location)}`;

    const res = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // 5 min revalidation
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend returned HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching category details from backend:', error);
    return NextResponse.json(
      { error: 'Failed to connect to category service' },
      { status: 503 }
    );
  }
}
