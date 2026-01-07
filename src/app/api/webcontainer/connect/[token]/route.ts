import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token

  // WebContainer connection authorization
  // This endpoint is called when WebContainer needs to authorize a preview connection
  console.log('[WebContainer] Connection request for token:', token)

  // Return success response to allow the connection
  return NextResponse.json({
    authorized: true,
    token
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token

  console.log('[WebContainer] POST connection request for token:', token)

  return NextResponse.json({
    authorized: true,
    token
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
