import { NextResponse } from 'next/server';
import { db } from '../../../utils/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET: Fetch all registered custom domains
export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, 'custom_domains'));
    const domains: string[] = [];
    querySnapshot.forEach((doc) => {
      domains.push(doc.data().domain);
    });

    return NextResponse.json(
      { success: true, domains },
      { 
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}

// POST: Add a new custom domain and register it on Vercel dynamically
export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    const domainName = domain.trim().toLowerCase();

    // Check if domain is already registered in Firestore
    const q = query(collection(db, 'custom_domains'), where('domain', '==', domainName));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return NextResponse.json(
        { error: 'Domain already registered' },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Call Vercel API to add the domain to your deployment dynamically
    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID; // optional

    if (vercelToken && projectId) {
      const vercelUrl = `https://api.vercel.com/v9/projects/${projectId}/domains${teamId ? `?teamId=${teamId}` : ''}`;
      
      const vercelRes = await fetch(vercelUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domainName }),
      });

      if (!vercelRes.ok) {
        const errData = await vercelRes.json();
        throw new Error(errData.error?.message || 'Failed to add domain to Vercel');
      }
    }

    // Save domain mapping in Firestore
    await addDoc(collection(db, 'custom_domains'), {
      domain: domainName,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, domain: domainName },
      { 
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
