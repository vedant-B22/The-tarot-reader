import { getTokenById } from '@/lib/db';
import CustomerTokenLive from '@/components/CustomerTokenLive';
import { notFound } from 'next/navigation';
import OfflineBanner from '@/components/OfflineBanner';

export const dynamic = 'force-dynamic';

export default async function TokenPage({ params }: { params: { id: string } }) {
  const token = getTokenById(params.id);

  if (!token) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OfflineBanner />
      <CustomerTokenLive initialTokenId={params.id} />
    </div>
  );
}
