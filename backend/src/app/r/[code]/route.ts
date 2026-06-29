import { NextResponse } from 'next/server';
import { db } from '../../../utils/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const url = new URL(request.url);
  const hostname = url.hostname; // e.g. "ahmad.link" or "localhost"

  try {
    const docRef = doc(db, 'short_links', code);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    const data = docSnap.data();

    // Verify Custom Domain:
    // If the short link belongs to a custom domain, block access if requested from a different domain
    if (data.customDomain && data.customDomain !== hostname && !hostname.includes('localhost') && !hostname.includes('vercel.app')) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Increment click count in the background
    try {
      await updateDoc(docRef, {
        clicksCount: increment(1)
      });
    } catch (err) {
      console.warn('Failed to increment click count:', err);
    }

    // Perform redirect to original URL destination
    return NextResponse.redirect(new URL(data.longUrl));
  } catch (error) {
    console.warn('Redirect failed:', error);
    return NextResponse.redirect(new URL('/404', request.url));
  }
}
