import { NextResponse } from 'next/server';
import { db } from '../../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// GET: Fetch all shortened links for the dashboard
export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, 'short_links'));
    const links: any[] = [];
    querySnapshot.forEach((doc) => {
      links.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json(
      { success: true, links },
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
