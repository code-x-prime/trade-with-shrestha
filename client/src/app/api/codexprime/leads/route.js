import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeader(request) {
  const existingAuth = request.headers.get('authorization');
  if (existingAuth) return existingAuth;
  const accessToken = request.cookies.get('accessToken')?.value;
  if (accessToken) return `Bearer ${accessToken}`;
  return '';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/codexprime/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to submit lead' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const authHeader = getAuthHeader(request);
    const url = new URL(request.url);
    const response = await fetch(`${API_BASE_URL}/codexprime/leads/admin?${url.searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: 'no-store',
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
