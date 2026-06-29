import { NextResponse } from 'next/server';
import { db } from '../../../utils/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers':
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}

// POST handler for link shortening
export async function POST(request: Request) {
  try {
    const { longUrl, customAlias, customDomain } = await request.json();

    if (!longUrl) {
      return NextResponse.json(
        { error: 'longUrl is required' },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    let code = customAlias ? customAlias.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : '';

    if (code) {
      // Check if custom alias already exists
      const docRef = doc(db, 'short_links', code);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return NextResponse.json(
          { error: 'Custom alias already taken' },
          { 
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' }
          }
        );
      }
    } else {
      // Generate a unique code
      let unique = false;
      let attempts = 0;
      while (!unique && attempts < 10) {
        code = generateShortCode();
        const docRef = doc(db, 'short_links', code);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          unique = true;
        }
        attempts++;
      }
      if (!unique) {
        throw new Error('Failed to generate unique code');
      }
    }

    // Save to Firestore
    const linkDoc = {
      longUrl,
      code,
      customDomain: customDomain || null,
      clicksCount: 0,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'short_links', code), linkDoc);

    return NextResponse.json(
      { success: true, code, customDomain: linkDoc.customDomain },
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
